import { readFile, readdir, lstat, realpath, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname, join, sep, isAbsolute } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify, isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';

// Non-normative local tooling formats. These are not Governance schemas.
const exec = promisify(execFile);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const same = isDeepStrictEqual;
const text = value => typeof value === 'string' && value.trim().length > 0;
const inside = (root, path) => { const rel = relative(root, path); return rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel); };
const overlaps = (a, b) => inside(a, b) || inside(b, a);
const helperHash = async () => hash(await readFile(new URL(import.meta.url)));

// Reject all symlinks, including directory junctions, rather than following them.
// This is preflight/path hygiene, not an adversarial filesystem sandbox.
async function localPath(root, name, missing = false) {
  if (!text(name) || isAbsolute(name) || name.includes('\\') || name.includes(':') || name.includes('\0') || name.split('/').includes('..'))
    throw new Error(`expected a workspace-relative slash path: ${name}`);
  const path = resolve(root, name);
  if (!inside(root, path)) throw new Error(`path escapes workspace: ${name}`);
  let cursor = root;
  for (const part of relative(root, path).split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    let info;
    try { info = await lstat(cursor); }
    catch (error) { if (missing && error.code === 'ENOENT') return path; throw error; }
    if (info.isSymbolicLink()) throw new Error(`symlink/junction is unsupported: ${name}`);
    if (!inside(root, await realpath(cursor))) throw new Error(`real path escapes workspace: ${name}`);
  }
  return path;
}

async function snapshot(root, targets) {
  const files = {}, errors = [];
  async function visit(name) {
    const path = await localPath(root, name), info = await lstat(path);
    if (info.isDirectory()) {
      for (const entry of (await readdir(path)).sort()) await visit(`${name}/${entry}`);
    } else if (info.isFile()) files[name] = hash(await readFile(path));
    else throw new Error(`not a regular file/directory: ${name}`);
  }
  for (const name of targets ?? []) {
    try { await visit(name); } catch (error) { errors.push(`${name}: ${error.message}`); }
  }
  if (Object.keys(files).length === 0) errors.push('declared target scope contains no readable files');
  return { files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b, 'en'))), errors };
}

function validate(plan) {
  const errors = [];
  if (plan?.format !== 'verification-plan/local-v1') errors.push('unsupported non-normative plan format');
  for (const key of ['source', 'scope']) if (!text(plan?.requirement?.[key])) errors.push(`requirement.${key} is required`);
  if (!Array.isArray(plan?.targets) || !plan.targets.length || !plan.targets.every(text)) errors.push('nonempty targets are required');
  if (!text(plan?.artifactDir)) errors.push('artifactDir is required');
  if (!Array.isArray(plan?.checks) || !plan.checks.length) errors.push('nonempty checks are required');
  const labels = new Set();
  for (const [index, check] of (Array.isArray(plan?.checks) ? plan.checks : []).entries()) {
    const prefix = `checks[${index}]`;
    if (!check || typeof check !== 'object') { errors.push(`${prefix} must be an object`); continue; }
    for (const key of ['label', 'inputs', 'expected', 'basis', 'failure', 'permissions']) if (!text(check[key])) errors.push(`${prefix}.${key} is required`);
    if (labels.has(check.label)) errors.push(`${prefix}.label must be unique`);
    labels.add(check.label);
    if (!['command', 'human'].includes(check.kind)) errors.push(`${prefix}.kind must be command or human`);
    if (check.kind !== 'command') continue;
    if (!text(check.command?.executable) || !Array.isArray(check.command?.args) || !check.command.args.every(x => typeof x === 'string') || !text(check.command?.cwd))
      errors.push(`${prefix}: executable, string args and workspace-relative cwd are required`);
    if (!Number.isInteger(check.timeoutMs) || check.timeoutMs < 1 || check.timeoutMs > 3_600_000) errors.push(`${prefix}: timeoutMs must be 1..3600000`);
    if (!Number.isInteger(check.maxOutputBytes) || check.maxOutputBytes < 1 || check.maxOutputBytes > 1_048_576) errors.push(`${prefix}: maxOutputBytes must be 1..1048576 per stream`);
    const assertion = check.assertions;
    if (!assertion || assertion.exitCode !== 0) errors.push(`${prefix}: assertions.exitCode must explicitly be 0`);
    for (const key of ['stdoutIncludes', 'stderrIncludes']) if (assertion?.[key] !== undefined && (!Array.isArray(assertion[key]) || !assertion[key].length || !assertion[key].every(text))) errors.push(`${prefix}: ${key} must contain nonempty strings`);
    if (assertion?.testSummary !== undefined && assertion.testSummary !== 'node-tap') errors.push(`${prefix}: only node-tap summary is supported`);
    if (assertion && Object.keys(assertion).some(key => !['exitCode', 'stdoutIncludes', 'stderrIncludes', 'testSummary'].includes(key))) errors.push(`${prefix}: unknown assertion`);
  }
  return errors;
}

export async function inspectPlan(workspace, planName) {
  const root = await realpath(resolve(workspace));
  let plan, planHash = null, errors = [];
  try { const bytes = await readFile(await localPath(root, planName)); planHash = hash(bytes); plan = JSON.parse(bytes); }
  catch (error) { return { root, planName, planHash, plan: null, errors: [error.message], snapshot: { files: {}, errors: [] } }; }
  errors.push(...validate(plan));
  if (errors.length) return { root, planName, planHash, plan, errors, snapshot: { files: {}, errors: [] } };
  try {
    const artifacts = await localPath(root, plan.artifactDir, true);
    if (artifacts === root || ['canon', 'governance', 'tooling', '.git', 'work/tasks'].some(name => inside(resolve(root, name), artifacts))) throw new Error('artifactDir must be a dedicated local artifact or Work report directory');
    if (inside(artifacts, resolve(root, planName))) throw new Error('plan cannot live inside artifactDir');
    for (const target of plan.targets) {
      // No exclusions: reject overlap instead of silently ignoring sources or tests.
      if (overlaps(resolve(root, target), artifacts)) throw new Error(`target overlaps artifactDir: ${target}`);
    }
    for (const check of plan.checks.filter(x => x.kind === 'command')) {
      const cwd = await localPath(root, check.command.cwd);
      if (!(await lstat(cwd)).isDirectory()) throw new Error(`cwd is not a directory: ${check.command.cwd}`);
      if (!['win32', 'linux', 'darwin'].includes(process.platform)) throw new Error(`unsupported platform: ${process.platform}`);
      if (/\.(cmd|bat|ps1)$/i.test(check.command.executable)) throw new Error('shell scripts are unsupported; invoke a native executable with argument array');
      if (check.command.executable.includes('/') || check.command.executable.includes('\\')) {
        if (!isAbsolute(check.command.executable)) await localPath(root, check.command.executable);
      }
    }
  } catch (error) { errors.push(error.message); }
  const observed = await snapshot(root, plan.targets);
  errors.push(...observed.errors);
  return { root, planName, planHash, plan, errors, snapshot: observed };
}

async function gitInfo(root) {
  try {
    const run = async args => (await exec('git', args, { cwd: root, timeout: 2000, maxBuffer: 65536, windowsHide: true })).stdout.trim();
    return { available: true, head: await run(['rev-parse', 'HEAD']), status: await run(['status', '--porcelain=v1', '--untracked-files=all']) };
  } catch { return { available: false, note: 'Git metadata unavailable; declared content hashes remain the evidence basis.' }; }
}

async function terminateTree(child) {
  if (!child.pid) return 'NO_PROCESS';
  if (process.platform === 'win32') {
    try { await exec(join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'taskkill.exe'), ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, timeout: 2000 }); return 'WINDOWS_TASKKILL_TREE'; }
    catch { child.kill(); return 'DIRECT_CHILD_FALLBACK'; }
  }
  try { process.kill(-child.pid, 'SIGKILL'); return 'POSIX_PROCESS_GROUP'; }
  catch { child.kill('SIGKILL'); return 'DIRECT_CHILD_FALLBACK'; }
}

async function invocationFor(root, check) {
  const cwd = await localPath(root, check.command.cwd);
  const configured = check.command.executable;
  const executable = configured === 'node' ? process.execPath : isAbsolute(configured) ? resolve(configured) : !/[\\/]/.test(configured) ? configured : await localPath(root, configured);
  return { executable, args: [...check.command.args], cwd };
}

async function commandRun(root, check, abortSignal) {
  const invocation = await invocationFor(root, check);
  const { cwd, executable } = invocation;
  const streams = { stdout: { chunks: [], bytes: 0, retained: 0 }, stderr: { chunks: [], bytes: 0, retained: 0 } };
  const startedAt = new Date().toISOString();
  return new Promise(resolveResult => {
    let child, cause, failure = null, cleanup = 'NOT_REQUESTED', cleanupWork, finished = false, fallback;
    const finish = async (exitCode, signal, missing = false) => {
      if (finished) return; finished = true;
      clearTimeout(timeout); clearTimeout(fallback); abortSignal?.removeEventListener('abort', interrupt);
      await cleanupWork;
      resolveResult({ label: check.label, startedAt, endedAt: new Date().toISOString(), executable, cwd, invocation,
        outcome: cause ?? (failure ? 'FAILED_TO_START' : missing ? 'INCOMPLETE' : signal ? 'SIGNALED' : 'EXITED'), exitCode, signal, failure,
        observationMissing: missing, cleanup,
        ...Object.fromEntries(Object.entries(streams).map(([name, stream]) => [name, { bytes: stream.bytes, retained: stream.retained, truncated: stream.bytes > stream.retained, data: Buffer.concat(stream.chunks) }])) });
    };
    const stop = reason => {
      if (cause || finished) return;
      cause = reason;
      cleanupWork = terminateTree(child).then(value => { cleanup = value; }).catch(() => { cleanup = 'CLEANUP_FAILED'; });
      // Descendants can retain pipes after their parent exits. Bound that wait too.
      fallback = setTimeout(() => { child.stdout?.destroy(); child.stderr?.destroy(); finish(null, null, true); }, 2500);
    };
    const interrupt = () => stop('INTERRUPTED');
    const timeout = setTimeout(() => stop('TIMED_OUT'), check.timeoutMs);
    try {
      const env = { ...process.env };
      delete env.NODE_TEST_CONTEXT; // Do not make an invoked test runner a child of this helper's test harness.
      child = spawn(executable, check.command.args, { cwd, env, shell: false, windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
      for (const name of ['stdout', 'stderr']) child[name].on('data', chunk => {
        const stream = streams[name], keep = Math.min(chunk.length, check.maxOutputBytes - stream.retained);
        stream.bytes += chunk.length;
        if (keep > 0) { stream.chunks.push(chunk.subarray(0, keep)); stream.retained += keep; }
      });
      child.on('error', error => { failure = error.message; });
      child.on('close', (code, signal) => finish(code, signal));
      abortSignal?.addEventListener('abort', interrupt, { once: true });
      if (abortSignal?.aborted) interrupt();
    } catch (error) { failure = error.message; finish(null, null); }
  });
}

// Decode only Node TAP's hash/backslash escapes, without trimming filename space.
// Control escapes are not reversible: a literal backslash + n and a newline can
// share a display name. They cannot establish a named case below.
function nodeTapName(display) {
  if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(display)) return null;
  let name = '';
  for (let index = 0; index < display.length; index++) {
    const char = display[index];
    if (char === '#') return null;
    if (char !== '\\') { name += char; continue; }
    const escaped = display[++index];
    if (escaped !== '\\' && escaped !== '#') return null;
    name += escaped;
  }
  return name;
}

// Only explicit regular-file Node --test invocations are understood. Compare
// observed names to actual invocation targets; never infer cases from extensions.
async function namedNodeCases(root, check, run) {
  if (resolve(run.executable) !== resolve(process.execPath)) return { reason: 'node-tap requires the native Node executable' };
  const files = [];
  let test = false, tap = false, positional = false;
  for (let index = 0; index < check.command.args.length; index++) {
    const arg = check.command.args[index];
    if (!positional && arg === '--test') test = true;
    else if (!positional && arg === '--test-reporter=tap') tap = true;
    else if (!positional && arg === '--test-reporter' && check.command.args[index + 1] === 'tap') { tap = true; index++; }
    else if (!positional && arg === '--') positional = true;
    else if (arg.startsWith('-') || /[*?\[\]{}]/.test(arg)) return { reason: 'unsupported or ambiguous Node test invocation' };
    else {
      const file = resolve(run.cwd, arg);
      try {
        const local = relative(root, file).split(sep).join('/');
        if (!(await lstat(await localPath(root, local))).isFile()) return { reason: 'explicit regular test files are required' };
      } catch { return { reason: 'test invocation target is unavailable or outside the declared workspace' }; }
      files.push(file);
    }
  }
  if (!test || !tap || !files.length) return { reason: 'explicit Node --test files and TAP reporter are required; discovery is unverified' };
  if (files.some(file => /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(file))) return { reason: 'control characters in invocation-file names are unverified' };
  const names = [...run.stdout.data.toString('utf8').matchAll(/^# Subtest: ([^\r\n]*)\r?$/gm)].map(match => nodeTapName(match[1]));
  const isFileName = name => files.some(file => relative(file, resolve(run.cwd, name)) === '');
  let named = false;
  for (const name of names) {
    if (name === null || !name) return { reason: 'unsupported or ambiguous Node TAP display name' };
    if (isFileName(name)) continue;
    if (/\\[bfnrtv]/.test(name)) return { reason: 'ambiguous Node TAP control-character escape' };
    named = true;
  }
  return named ? {} : { reason: 'only invocation-file wrappers or no named test cases were observed' };
}

async function evaluate(root, check, run) {
  const reasons = [];
  if (run.outcome !== 'EXITED' || run.observationMissing || !Number.isInteger(run.exitCode)) return { status: 'BLOCKED', reasons: [run.outcome, 'complete normal exit was not observed'], testExecution: 'UNKNOWN' };
  if (run.exitCode !== check.assertions.exitCode) return { status: 'NOT_SATISFIED', reasons: [`exit ${run.exitCode}, expected ${check.assertions.exitCode}`], testExecution: 'UNKNOWN' };
  if (run.stdout.truncated || run.stderr.truncated) return { status: 'UNVERIFIED', reasons: ['bounded output was truncated; assertions cannot establish a complete observation'], testExecution: 'UNKNOWN' };
  for (const name of ['stdout', 'stderr']) for (const expected of check.assertions[`${name}Includes`] ?? []) if (!run[name].data.toString('utf8').includes(expected)) reasons.push(`${name} lacks expected text: ${expected}`);
  if (reasons.length) return { status: 'NOT_SATISFIED', reasons, testExecution: 'UNKNOWN' };
  let testExecution = 'UNKNOWN';
  if (check.assertions.testSummary === 'node-tap') {
    const counts = {};
    for (const name of ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo']) {
      const matches = [...run.stdout.data.toString('utf8').matchAll(new RegExp(`^# ${name} ([0-9]+)\\r?$`, 'gm'))];
      if (matches.length !== 1) return { status: 'UNVERIFIED', reasons: ['complete unique node-tap summary was not observed'], testExecution };
      counts[name] = Number(matches[0][1]);
    }
    if (counts.tests !== counts.pass + counts.fail + counts.cancelled + counts.skipped + counts.todo) return { status: 'UNVERIFIED', reasons: ['inconsistent node-tap summary'], testExecution };
    testExecution = counts;
    if (counts.fail || counts.cancelled) return { status: 'NOT_SATISFIED', reasons: ['test failures or cancellations observed'], testExecution };
    if (!counts.tests || !counts.pass || counts.skipped || counts.todo) return { status: 'UNVERIFIED', reasons: ['zero executed tests, skipped tests, or todo tests require review'], testExecution };
    const cases = await namedNodeCases(root, check, run);
    if (cases.reason) return { status: 'UNVERIFIED', reasons: [cases.reason], testExecution };
  } else if (!check.assertions.stdoutIncludes?.length && !check.assertions.stderrIncludes?.length) return { status: 'UNVERIFIED', reasons: ['exit 0 alone supplies no declared observation beyond process exit'], testExecution };
  return { status: 'SATISFIED', reasons: [], testExecution };
}

function aggregate(checks) {
  for (const status of ['BLOCKED', 'NOT_SATISFIED', 'UNVERIFIED']) if (checks.some(check => check.mechanical.status === status)) return status;
  return checks.length ? 'SATISFIED' : 'UNVERIFIED';
}

export async function runPlan(workspace, planName, { approval, signal } = {}) {
  const inspected = await inspectPlan(workspace, planName);
  if (inspected.errors.length || approval !== inspected.planHash) return { status: 'BLOCKED', executed: false, errors: [...inspected.errors, ...(approval !== inspected.planHash ? ['explicit approval must match the displayed plan SHA-256'] : [])] };
  const { root, plan, planHash } = inspected;
  // Revalidate before creating files. Outputs are exclusive and never replace prior runs.
  const artifacts = await localPath(root, plan.artifactDir, true);
  await mkdir(artifacts, { recursive: true });
  await localPath(root, plan.artifactDir);
  const runName = `${plan.artifactDir}/${Date.now()}-${randomUUID()}`;
  const output = await localPath(root, runName, true);
  await mkdir(output);
  const result = { format: 'verification-result/local-v1', root, planName, planHash, helperHash: await helperHash(), startedAt: new Date().toISOString(),
    environment: { platform: process.platform, arch: process.arch, node: process.version, removedEnvironmentKeys: ['NODE_TEST_CONTEXT'] }, gitBefore: await gitInfo(root), before: inspected.snapshot, checks: [], semanticAcceptance: 'UNVERIFIED',
    limitations: ['Declared scope only; dependencies are not discovered automatically.', 'Before/after hashes cannot detect changes reverted during execution or prove resistance to malicious tampering.', 'Child network/filesystem effects rely on the execution environment; this helper is not a sandbox.', 'Logs and command arguments may contain secrets; review before sharing.', 'Cleanup covers ordinary process trees/groups best-effort; detached descendants and concurrent path swaps may escape observation.'] };
  for (const [index, check] of plan.checks.entries()) {
    if (check.kind === 'human' || signal?.aborted) {
      const at = new Date().toISOString();
      result.checks.push({ label: check.label, startedAt: at, endedAt: at, outcome: check.kind === 'human' ? 'HUMAN_REVIEW_REQUIRED' : 'NOT_RUN', mechanical: { status: signal?.aborted ? 'BLOCKED' : 'UNVERIFIED', reasons: [signal?.aborted ? 'interrupted before execution' : 'human acceptance is never automatic'] } });
      continue;
    }
    const run = await commandRun(root, check, signal);
    run.mechanical = await evaluate(root, check, run);
    for (const name of ['stdout', 'stderr']) {
      const log = `${index + 1}.${name}.log`;
      await writeFile(join(output, log), run[name].data, { flag: 'wx' });
      run[name].sha256 = hash(run[name].data);
      delete run[name].data;
      run[name].path = `${runName}/${log}`;
    }
    result.checks.push(run);
  }
  const after = await inspectPlan(root, planName);
  result.after = after.snapshot;
  result.planHashAfter = after.planHash;
  result.gitAfter = await gitInfo(root);
  result.endedAt = new Date().toISOString();
  result.binding = !after.errors.length && planHash === after.planHash && same(result.before.files, result.after.files) && result.helperHash === await helperHash() ? 'UNCHANGED' : 'CHANGED_OR_UNREADABLE';
  result.bindingErrors = after.errors;
  result.status = result.binding === 'UNCHANGED' ? aggregate(result.checks) : 'UNVERIFIED';
  result.resultPath = `${runName}/result.json`;
  await writeFile(join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  return result;
}

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = value => Array.isArray(value) && value.every(x => typeof x === 'string');
const digest = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const timestamp = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const statuses = ['SATISFIED', 'NOT_SATISFIED', 'BLOCKED', 'UNVERIFIED'];

// Minimal shape and cross-field consistency for the existing local result format.
// This detects damage/omissions; an editable record is not an attestation.
async function recordProblems(root, plan, result, resultName) {
  const errors = [], add = message => errors.push(message);
  if (!object(result) || result.format !== 'verification-result/local-v1') return ['unsupported execution record'];
  for (const key of ['root', 'planName', 'resultPath']) if (!text(result[key])) add(`missing or invalid result.${key}`);
  for (const key of ['planHash', 'planHashAfter', 'helperHash']) if (!digest(result[key])) add(`missing or invalid result.${key}`);
  for (const key of ['startedAt', 'endedAt']) if (!timestamp(result[key])) add(`missing or invalid result.${key}`);
  if (Date.parse(result.startedAt) > Date.parse(result.endedAt)) add('result execution times are reversed');
  if (!statuses.includes(result.status) || result.semanticAcceptance !== 'UNVERIFIED' || !['UNCHANGED', 'CHANGED_OR_UNREADABLE'].includes(result.binding) || !strings(result.bindingErrors)) add('invalid result status/binding metadata');
  const env = result.environment;
  if (!object(env) || !['win32', 'linux', 'darwin'].includes(env.platform) || !text(env.arch) || typeof env.node !== 'string' || !/^v\d+\.\d+\.\d+/.test(env.node) || !same(env.removedEnvironmentKeys, ['NODE_TEST_CONTEXT'])) add('missing or invalid result.environment');
  for (const key of ['before', 'after']) {
    const observed = result[key];
    if (!object(observed) || !object(observed.files) || !Object.keys(observed.files).length || !Object.entries(observed.files).every(([name, value]) => text(name) && digest(value)) || !strings(observed.errors)) add(`missing or invalid result.${key} snapshot`);
    else if (observed.errors.length) add(`${key} snapshot is incomplete`);
  }
  if (!Array.isArray(result.checks) || result.checks.length !== plan.checks.length || !result.checks.length) return [...errors, 'check observations are incomplete'];
  const expectedResult = resolve(root, resultName);
  if (!text(result.resultPath) || resolve(root, result.resultPath) !== expectedResult || !inside(resolve(root, plan.artifactDir), expectedResult)) add('result path is inconsistent with the plan artifact directory');
  let previousEnd = Date.parse(result.startedAt);
  for (const [index, check] of plan.checks.entries()) {
    const run = result.checks[index], prefix = `checks[${index}]`;
    if (!object(run)) { add(`${prefix}: missing observation`); continue; }
    if (run.label !== check.label) add(`${prefix}: check identity changed`);
    if (!timestamp(run.startedAt) || !timestamp(run.endedAt) || Date.parse(run.startedAt) < previousEnd || Date.parse(run.endedAt) < Date.parse(run.startedAt) || Date.parse(run.endedAt) > Date.parse(result.endedAt)) add(`${prefix}: missing or inconsistent execution times`);
    previousEnd = Date.parse(run.endedAt);
    if (!object(run.mechanical) || !statuses.includes(run.mechanical.status) || !strings(run.mechanical.reasons)) { add(`${prefix}: invalid mechanical observation`); continue; }
    if (check.kind === 'human' || run.outcome === 'NOT_RUN') {
      if (check.kind === 'human' ? run.outcome !== 'HUMAN_REVIEW_REQUIRED' || !['UNVERIFIED', 'BLOCKED'].includes(run.mechanical.status) : run.mechanical.status !== 'BLOCKED') add(`${prefix}: unexecuted/human item cannot be satisfied`);
      if (['executable', 'cwd', 'invocation', 'exitCode', 'signal', 'observationMissing', 'failure', 'cleanup', 'stdout', 'stderr'].some(key => Object.hasOwn(run, key))) add(`${prefix}: unexecuted item contains execution metadata`);
      if (!run.mechanical.reasons.length) add(`${prefix}: unexecuted item requires a reason`);
      continue;
    }
    if (!text(run.executable) || !text(run.cwd) || !object(run.invocation)) add(`${prefix}: missing execution identity`);
    try {
      const expected = await invocationFor(root, check);
      if (!same(run.invocation, expected) || run.executable !== expected.executable || run.cwd !== expected.cwd) add(`${prefix}: recorded invocation contradicts the approved plan`);
    } catch (error) { add(`${prefix}: invocation unavailable: ${error.message}`); }
    const code = run.exitCode === null || Number.isInteger(run.exitCode);
    const signal = run.signal === null || typeof run.signal === 'string' && /^SIG[A-Z0-9]+$/.test(run.signal);
    const failure = run.failure === null || text(run.failure);
    if (!code || !signal || !failure || typeof run.observationMissing !== 'boolean') add(`${prefix}: missing or invalid exit/signal/failure/completeness fields`);
    const stopped = ['TIMED_OUT', 'INTERRUPTED'].includes(run.outcome);
    if (!['EXITED', 'FAILED_TO_START', 'SIGNALED', 'TIMED_OUT', 'INTERRUPTED', 'INCOMPLETE'].includes(run.outcome)) add(`${prefix}: unsupported process outcome`);
    if (!['NOT_REQUESTED', 'NO_PROCESS', 'WINDOWS_TASKKILL_TREE', 'POSIX_PROCESS_GROUP', 'DIRECT_CHILD_FALLBACK', 'CLEANUP_FAILED'].includes(run.cleanup) || stopped && run.cleanup === 'NOT_REQUESTED') add(`${prefix}: missing or inconsistent cleanup observation`);
    if (run.outcome === 'EXITED' && (!Number.isInteger(run.exitCode) || run.exitCode < 0 || run.signal !== null || run.failure !== null || run.observationMissing !== false || run.cleanup !== 'NOT_REQUESTED')) add(`${prefix}: normal exit metadata is inconsistent`);
    if (run.outcome === 'FAILED_TO_START' && (!text(run.failure) || run.signal !== null || run.observationMissing !== false || run.cleanup !== 'NOT_REQUESTED')) add(`${prefix}: failed-start metadata is inconsistent`);
    if (run.outcome === 'SIGNALED' && (run.exitCode !== null || !text(run.signal) || run.failure !== null || run.observationMissing !== false || run.cleanup !== 'NOT_REQUESTED')) add(`${prefix}: signal metadata is inconsistent`);
    if (run.observationMissing === true || run.outcome === 'INCOMPLETE' || stopped && run.exitCode === null && run.signal === null && run.failure === null) add(`${prefix}: execution observation is incomplete`);
    for (const name of ['stdout', 'stderr']) {
      const stream = run[name];
      const directory = text(result.resultPath) ? result.resultPath.slice(0, result.resultPath.lastIndexOf('/')) : '';
      const expectedLog = `${directory}/${index + 1}.${name}.log`;
      if (!object(stream) || !Number.isSafeInteger(stream.bytes) || stream.bytes < 0 || !Number.isSafeInteger(stream.retained) || stream.retained !== Math.min(stream.bytes, check.maxOutputBytes) || typeof stream.truncated !== 'boolean' || stream.truncated !== (stream.bytes > stream.retained) || !digest(stream.sha256) || stream.path !== expectedLog) add(`${prefix}.${name}: missing or inconsistent bytes/retained/truncated/hash/path`);
    }
  }
  return errors;
}

export async function checkEvidence(workspace, planName, resultName) {
  const current = await inspectPlan(workspace, planName);
  if (current.errors.length) return { current: false, status: 'BLOCKED', reasons: current.errors };
  let result;
  try { result = JSON.parse(await readFile(await localPath(current.root, resultName), 'utf8')); }
  catch (error) { return { current: false, status: 'BLOCKED', reasons: [error.message] }; }
  const malformed = await recordProblems(current.root, current.plan, result, resultName);
  if (malformed.length) return { current: false, status: 'BLOCKED', semanticAcceptance: 'UNVERIFIED', reasons: malformed };
  const reasons = [];
  if (result.root !== current.root || result.planName !== planName || result.planHash !== current.planHash || result.planHashAfter !== current.planHash) reasons.push('workspace or plan changed');
  if (result.helperHash !== await helperHash()) reasons.push('helper changed');
  if (result.binding !== 'UNCHANGED' || !same(result.before.files, result.after.files) || !same(result.after.files, current.snapshot.files)) reasons.push('declared target files changed, were added/deleted, or could not be observed');
  for (const [index, check] of current.plan.checks.entries()) {
    const recorded = result.checks[index];
    if (check.kind === 'human' || recorded.outcome === 'NOT_RUN') continue;
    try {
      const observed = { ...recorded };
      for (const name of ['stdout', 'stderr']) {
        const data = await readFile(await localPath(current.root, recorded[name].path));
        if (hash(data) !== recorded[name].sha256 || data.length !== recorded[name].retained) throw new Error('log missing or changed');
        observed[name] = { ...recorded[name], data };
      }
      if (!same(await evaluate(current.root, check, observed), recorded.mechanical)) reasons.push(`checks[${index}]: mechanical observation is inconsistent`);
    } catch (error) { reasons.push(`observation unavailable: ${error.message}`); }
  }
  if (result.status !== aggregate(result.checks)) reasons.push('recorded status is inconsistent');
  return { current: reasons.length === 0, status: reasons.length ? 'UNVERIFIED' : result.status, semanticAcceptance: 'UNVERIFIED', reasons };
}

async function main(argv) {
  const planName = argv[0];
  let run = false, approval, resultName;
  for (let index = 1; index < argv.length; index++) {
    if (argv[index] === '--run' && !run) run = true;
    else if (argv[index] === '--approve' && approval === undefined) approval = argv[++index];
    else if (argv[index] === '--check' && resultName === undefined) resultName = argv[++index];
    else throw new Error(`unknown or duplicate argument: ${argv[index]}`);
  }
  if (!planName || planName.startsWith('-') || (approval !== undefined && !run) || (run && resultName !== undefined) || argv.at(-1) === '--approve' || argv.at(-1) === '--check')
    throw new Error('usage: node verify.mjs PLAN.json [--run --approve PLAN_SHA256 | --check RESULT.json]');
  if (resultName) return checkEvidence(process.cwd(), planName, resultName);
  if (!run) { const plan = await inspectPlan(process.cwd(), planName); return { mode: 'PLAN_ONLY', status: plan.errors.length ? 'BLOCKED' : 'UNVERIFIED', executed: false, ...plan, note: 'Review commands, permissions, scope, limits and artifactDir; --run --approve SHA256 is explicit execution authorization. No semantic acceptance is inferred.' }; }
  const controller = new AbortController();
  const abort = () => controller.abort();
  process.on('SIGINT', abort); process.on('SIGTERM', abort);
  try { return await runPlan(process.cwd(), planName, { approval, signal: controller.signal }); }
  finally { process.off('SIGINT', abort); process.off('SIGTERM', abort); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = await main(process.argv.slice(2));
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exitCode = result.mode === 'PLAN_ONLY' && !result.errors.length || result.status === 'SATISFIED' ? 0 : 1;
  } catch (error) { process.stderr.write(`VERIFICATION TOOL FAILURE: ${error.message}\n`); process.exitCode = 2; }
}
