import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { inspectPlan, runPlan, checkEvidence } from '../../tooling/verify/verify.mjs';

const exec = promisify(execFile);
const helper = resolve(import.meta.dirname, '../../tooling/verify/verify.mjs');
async function fixture(fn) {
  const root = await mkdtemp(join(tmpdir(), 'verification-record-'));
  try {
    await mkdir(join(root, 'tests')); await writeFile(join(root, 'tests/input'), '42');
    const plan = { format: 'verification-plan/local-v1', requirement: { source: 'tests/input', scope: 'record completeness' }, targets: ['tests'], artifactDir: '.runs', checks: [{ label: 'probe', kind: 'command', inputs: '42', expected: 'observed: 42', basis: 'explicit fixture', failure: 'missing or contradictory observation', permissions: 'local temporary fixture only', command: { executable: 'node', args: ['-e', 'console.log("observed: 42")'], cwd: '.' }, timeoutMs: 3000, maxOutputBytes: 8192, assertions: { exitCode: 0, stdoutIncludes: ['observed: 42'] } }] };
    const run = async options => {
      await writeFile(join(root, 'plan.json'), JSON.stringify(plan));
      return runPlan(root, 'plan.json', { approval: (await inspectPlan(root, 'plan.json')).planHash, ...options });
    };
    await fn({ root, plan, run });
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('each required record field is independently required; omitted values never default to success', async () => fixture(async ({ root, run }) => {
  const original = await run(); assert.equal((await checkEvidence(root, 'plan.json', original.resultPath)).current, true);
  const paths = [
    ...['root', 'planName', 'resultPath', 'startedAt', 'endedAt', 'environment', 'before', 'after', 'planHash', 'planHashAfter', 'helperHash', 'bindingErrors', 'semanticAcceptance'].map(key => [key]),
    ...['platform', 'arch', 'node', 'removedEnvironmentKeys'].map(key => ['environment', key]),
    ...['executable', 'cwd', 'invocation', 'startedAt', 'endedAt', 'exitCode', 'signal', 'failure', 'observationMissing', 'cleanup'].map(key => ['checks', 0, key]),
    ...['stdout', 'stderr'].flatMap(name => ['bytes', 'retained', 'truncated', 'sha256', 'path'].map(key => ['checks', 0, name, key]))
  ];
  for (const path of paths) {
    const changed = structuredClone(original); let owner = changed;
    for (const key of path.slice(0, -1)) owner = owner[key];
    delete owner[path.at(-1)];
    await writeFile(join(root, original.resultPath), JSON.stringify(changed));
    const checked = await checkEvidence(root, 'plan.json', original.resultPath);
    assert.equal(checked.current, false, path.join('.')); assert.notEqual(checked.status, 'SATISFIED'); assert.ok(checked.reasons.length);
  }
}));

test('contradictory invocation, outcome, timing, output metadata and malformed record types are rejected', async () => fixture(async ({ root, run }) => {
  const original = await run();
  const changes = [
    r => { r.checks[0].invocation.args = ['--different']; }, r => { r.checks[0].cwd = '/different'; }, r => { r.checks[0].executable = '/different'; },
    r => { r.checks[0].signal = 'SIGTERM'; }, r => { r.checks[0].failure = 'start failed'; }, r => { r.checks[0].observationMissing = true; },
    r => { r.checks[0].endedAt = r.startedAt; r.checks[0].startedAt = '2099-01-01T00:00:00.000Z'; },
    r => { r.checks[0].cleanup = 'CLEANUP_FAILED'; }, r => { r.checks[0].stdout.bytes++; }, r => { r.checks[0].stdout.retained--; },
    r => { r.checks[0].stdout.truncated = true; }, r => { r.checks[0].stderr.bytes = '0'; }, r => { r.checks[0].stdout.path = r.checks[0].stderr.path; },
    r => { r.resultPath = 7; }, r => { r.environment = []; }, r => { r.environment.node = [process.version]; },
    r => { r.startedAt = '2026-02-31T00:00:00.000Z'; }, r => { r.checks[0] = null; }, r => { r.before.files = []; }
  ];
  for (const change of changes) {
    const record = structuredClone(original); change(record); await writeFile(join(root, original.resultPath), JSON.stringify(record));
    const checked = await checkEvidence(root, 'plan.json', original.resultPath);
    assert.equal(checked.current, false); assert.ok(checked.reasons.length);
  }
  await assert.rejects(exec(process.execPath, [helper, 'plan.json', '--check', original.resultPath], { cwd: root }), error => {
    assert.equal(error.code, 1); const checked = JSON.parse(error.stdout); assert.equal(checked.current, false); return true;
  });
}));

test('valid human, not-run, failed-start, timeout, interruption and truncated records retain their actual gates', async () => fixture(async ({ root, plan, run }) => {
  const check = async (record, expected) => {
    const checked = await checkEvidence(root, 'plan.json', record.resultPath);
    assert.equal(checked.current, true, JSON.stringify(checked)); assert.equal(checked.status, expected);
  };
  const command = structuredClone(plan.checks[0]);
  plan.checks = [{ ...command, kind: 'human' }]; await check(await run(), 'UNVERIFIED');
  plan.checks = [structuredClone(command)]; const already = new AbortController(); already.abort(); await check(await run({ signal: already.signal }), 'BLOCKED');
  plan.checks[0].command.executable = 'governance-no-such-program-584629'; await check(await run(), 'BLOCKED');
  plan.checks = [structuredClone(command)]; plan.checks[0].command.args = ['-e', 'setInterval(()=>{},1000)']; plan.checks[0].timeoutMs = 100; await check(await run(), 'BLOCKED');
  plan.checks[0].timeoutMs = 5000; const interrupted = new AbortController(); const timer = setTimeout(() => interrupted.abort(), 250);
  try { await check(await run({ signal: interrupted.signal }), 'BLOCKED'); } finally { clearTimeout(timer); }
  plan.checks = [structuredClone(command)]; plan.checks[0].command.args = ['-e', 'console.log("x".repeat(100))']; plan.checks[0].maxOutputBytes = 4; await check(await run(), 'UNVERIFIED');
}));

test('JSON property reordering preserves complete observations and resolved cwd identity is checked', async () => fixture(async ({ root, plan, run }) => {
  plan.checks[0].command.cwd = 'tests';
  const record = await run();
  const sorted = value => Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
  await writeFile(join(root, record.resultPath), JSON.stringify(sorted(record)));
  assert.equal((await checkEvidence(root, 'plan.json', record.resultPath)).current, true);
  record.checks[0].invocation.cwd = root;
  await writeFile(join(root, record.resultPath), JSON.stringify(record));
  assert.equal((await checkEvidence(root, 'plan.json', record.resultPath)).current, false);
}));

test('Node case identity follows explicit invocation files, not source extensions; unknown discovery stays unverified', async () => fixture(async ({ root, plan, run }) => {
  await writeFile(join(root, 'tests/genuine.mjs'), 'import {test} from "node:test";test("actual case.jsx",()=>{});');
  plan.checks[0].command.cwd = 'tests'; plan.checks[0].command.args = ['--test', '--test-reporter', 'tap', './genuine.mjs']; plan.checks[0].assertions = { exitCode: 0, testSummary: 'node-tap' };
  const genuine = await run(); assert.equal(genuine.status, 'SATISFIED'); assert.equal((await checkEvidence(root, 'plan.json', genuine.resultPath)).current, true);
  await writeFile(join(root, 'tests/arbitrary-name'), ''); plan.checks[0].command.args = ['--test', '--test-reporter=tap', resolve(root, 'tests/arbitrary-name')];
  assert.equal((await run()).status, 'UNVERIFIED');
  plan.checks[0].command.args = ['--test', '--test-reporter=tap']; assert.notEqual((await run()).status, 'SATISFIED');
}));
