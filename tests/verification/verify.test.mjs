import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, mkdir, symlink, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { inspectPlan, runPlan, checkEvidence } from '../../tooling/verify/verify.mjs';

const exec = promisify(execFile);
const helper = resolve(import.meta.dirname, '../../tooling/verify/verify.mjs');
function command(code = 'console.log("observed: 42")') {
  return { label: 'calculation', kind: 'command', inputs: 'six times seven', expected: 'observed: 42', basis: 'direct arithmetic: 6 * 7 = 42', failure: 'wrong output or nonzero exit', permissions: 'local runtime only; no service calls',
    command: { executable: 'node', args: ['-e', code], cwd: '.' }, timeoutMs: 2000, maxOutputBytes: 8192, assertions: { exitCode: 0, stdoutIncludes: ['observed: 42'] } };
}
async function fixture(fn) {
  const root = await mkdtemp(join(tmpdir(), 'verification-'));
  try {
    await mkdir(join(root, 'src')); await mkdir(join(root, 'tests'));
    await writeFile(join(root, 'src/value.txt'), '42'); await writeFile(join(root, 'tests/expected.txt'), '42');
    await writeFile(join(root, 'rules.txt'), 'direct calculation'); await writeFile(join(root, 'package-lock.json'), '{}');
    const plan = { format: 'verification-plan/local-v1', requirement: { source: 'rules.txt', scope: 'local calculation' }, targets: ['src', 'tests', 'rules.txt', 'package-lock.json'], artifactDir: '.verification-runs', checks: [command()] };
    const save = async () => writeFile(join(root, 'plan.json'), JSON.stringify(plan, null, 2));
    await save();
    const run = async options => runPlan(root, 'plan.json', { approval: (await inspectPlan(root, 'plan.json')).planHash, ...options });
    await fn({ root, plan, save, run });
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('default CLI plans without execution or artifact writes; exact plan approval is required', async () => fixture(async ({ root, plan, save, run }) => {
  plan.checks[0].command.args = ['-e', 'require("fs").writeFileSync("marker", "ran"); console.log("observed: 42")']; await save();
  const before = await readdir(root);
  const { stdout } = await exec(process.execPath, [helper, 'plan.json'], { cwd: root });
  const displayed = JSON.parse(stdout);
  assert.equal(displayed.mode, 'PLAN_ONLY'); assert.equal(displayed.executed, false); assert.equal(displayed.status, 'UNVERIFIED');
  assert.deepEqual(await readdir(root), before); assert.equal(displayed.plan.checks[0].timeoutMs, 2000);
  assert.equal((await run({ approval: 'incorrect' })).status, 'BLOCKED');
  assert.deepEqual(await readdir(root), before);
  const result = await run(); assert.equal(result.status, 'SATISFIED'); assert.equal(result.semanticAcceptance, 'UNVERIFIED');
  assert.equal(await readFile(join(root, 'marker'), 'utf8'), 'ran');
  assert.equal((await checkEvidence(root, 'plan.json', result.resultPath)).current, true);
}));

test('actual success, failure, missing executable and a POSIX signal have distinct observations', async () => fixture(async ({ plan, save, run }) => {
  plan.checks.push(command('process.exit(7)'), command());
  plan.checks[1].label = 'failure'; plan.checks[2].label = 'missing'; plan.checks[2].command.executable = 'governance-no-such-executable-8472';
  if (process.platform !== 'win32') { plan.checks.push(command('process.kill(process.pid,"SIGTERM")')); plan.checks[3].label = 'signal'; }
  await save(); const result = await run();
  assert.equal(result.checks[0].mechanical.status, 'SATISFIED');
  assert.equal(result.checks[1].outcome, 'EXITED'); assert.equal(result.checks[1].exitCode, 7); assert.equal(result.checks[1].mechanical.status, 'NOT_SATISFIED');
  assert.equal(result.checks[2].outcome, 'FAILED_TO_START'); assert.equal(result.status, 'BLOCKED');
  if (process.platform !== 'win32') assert.equal(result.checks[3].outcome, 'SIGNALED');
  plan.checks = [command('console.log("wrong observation")')]; await save(); assert.equal((await run()).status, 'NOT_SATISFIED');
}));

test('empty plans, absent commands, expected results and required fields cannot execute successfully', async () => {
  for (const change of [p => { p.checks = []; }, p => { delete p.checks[0].command; }, p => { delete p.checks[0].expected; }, p => { p.targets = []; }, p => { delete p.checks[0].permissions; }, p => { delete p.checks[0].assertions; }]) {
    await fixture(async ({ root, plan, save, run }) => {
      change(plan); await save(); const result = await run(); assert.equal(result.executed, false); assert.equal(result.status, 'BLOCKED');
      assert.ok(!(await readdir(root)).includes('.verification-runs'));
    });
  }
});

test('timeout and AbortSignal interruption are bounded and never successful', async () => fixture(async ({ root, plan, save, run }) => {
  plan.checks[0] = command('setInterval(()=>{},1000)'); plan.checks[0].timeoutMs = 150; await save();
  const timeout = await run(); assert.equal(timeout.checks[0].outcome, 'TIMED_OUT'); assert.equal(timeout.status, 'BLOCKED'); assert.notEqual(timeout.checks[0].cleanup, 'NOT_REQUESTED');
  plan.checks[0].command.args = ['-e', 'require("fs").writeFileSync("started", "yes");setInterval(()=>{},1000)'];
  plan.checks[0].timeoutMs = 10000; await save();
  const controller = new AbortController(); const pending = run({ signal: controller.signal });
  try {
    // Interrupt a confirmed running child, not preflight on a busy runner.
    let started = false; const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      try { started = await readFile(join(root, 'started'), 'utf8') === 'yes'; } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (started) break;
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    assert.equal(started, true, 'child startup was not observed within the bounded wait');
    controller.abort();
    const result = await pending; assert.equal(result.checks[0].outcome, 'INTERRUPTED'); assert.equal(result.status, 'BLOCKED');
  } finally { controller.abort(); await pending; }
  controller.abort(); const result = await run({ signal: controller.signal }); assert.equal(result.checks[0].outcome, 'NOT_RUN');
}));

test('retained stdout and stderr are capped independently, drained, and marked truncated', async () => fixture(async ({ root, plan, save, run }) => {
  plan.checks[0] = command('process.stdout.write("x".repeat(20000));process.stderr.write("y".repeat(30000))');
  plan.checks[0].maxOutputBytes = 100; await save(); const result = await run();
  for (const name of ['stdout', 'stderr']) { const stream = result.checks[0][name]; assert.equal(stream.retained, 100); assert.equal(stream.truncated, true); assert.equal((await readFile(join(root, stream.path))).length, 100); }
  assert.equal(result.checks[0].stdout.bytes, 20000); assert.equal(result.checks[0].stderr.bytes, 30000); assert.equal(result.status, 'UNVERIFIED');
}));

test('human review, exit-only commands and unsupported/missing/empty/skipped test observations remain unverified', async () => {
  await fixture(async ({ plan, save, run }) => {
    const human = { ...command(), kind: 'human', label: 'review' }; delete human.command;
    plan.checks.push(human); await save(); const result = await run(); assert.equal(result.status, 'UNVERIFIED'); assert.equal(result.checks[1].outcome, 'HUMAN_REVIEW_REQUIRED');
    plan.checks = [command('')]; plan.checks[0].assertions = { exitCode: 0 }; await save(); assert.equal((await run()).status, 'UNVERIFIED');
  });
  // Real Node test runner: positive execution, zero tests and all-skipped execution.
  for (const [body, expected] of [['import {test} from "node:test"; test("runs",()=>{});', 'SATISFIED'], ['', 'UNVERIFIED'], ['import {test} from "node:test"; test.skip("skips",()=>{});', 'UNVERIFIED']]) {
    await fixture(async ({ root, plan, save, run }) => {
      await writeFile(join(root, 'tests/actual.test.mjs'), body);
      plan.checks[0].command.args = ['--test', '--test-reporter=tap', 'tests/actual.test.mjs'];
      plan.checks[0].assertions = { exitCode: 0, testSummary: 'node-tap' }; await save();
      const result = await run();
      assert.equal(result.status, expected, JSON.stringify(result.checks));
    });
  }
  for (const output of ['no test summary', '# tests 0\n# pass 0\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0']) {
    await fixture(async ({ plan, save, run }) => {
      plan.checks[0] = command(`console.log(${JSON.stringify(output)})`); plan.checks[0].assertions = { exitCode: 0, testSummary: 'node-tap' }; await save(); assert.equal((await run()).status, 'UNVERIFIED');
    });
  }
});

test('content, tests, lockfile, plan, additions and deletions invalidate evidence at the same Git HEAD', async () => fixture(async ({ root, plan, save, run }) => {
  await exec('git', ['init'], { cwd: root });
  await exec('git', ['add', '.'], { cwd: root });
  await exec('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture'], { cwd: root });
  const head = (await exec('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout;
  const result = await run(); assert.equal((await checkEvidence(root, 'plan.json', result.resultPath)).current, true);
  for (const name of ['src/value.txt', 'tests/expected.txt', 'rules.txt', 'package-lock.json']) {
    const bytes = await readFile(join(root, name)); await writeFile(join(root, name), 'changed');
    assert.equal((await checkEvidence(root, 'plan.json', result.resultPath)).current, false); await writeFile(join(root, name), bytes);
  }
  await writeFile(join(root, 'src/new.txt'), 'new'); assert.equal((await checkEvidence(root, 'plan.json', result.resultPath)).current, false); await rm(join(root, 'src/new.txt'));
  await rm(join(root, 'src/value.txt')); assert.equal((await checkEvidence(root, 'plan.json', result.resultPath)).current, false); await writeFile(join(root, 'src/value.txt'), '42');
  plan.checks[0].expected = 'different'; await save(); assert.equal((await checkEvidence(root, 'plan.json', result.resultPath)).current, false);
  assert.equal((await exec('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout, head);
}));

test('target mutations during execution invalidate that run; new generated logs do not invalidate source evidence', async () => fixture(async ({ root, plan, save, run }) => {
  const first = await run(); await run();
  assert.equal((await checkEvidence(root, 'plan.json', first.resultPath)).current, true);
  assert.equal(first.gitBefore.available, false);
  plan.checks[0] = command('require("fs").writeFileSync("src/value.txt","changed");console.log("observed: 42")'); await save();
  const result = await run(); assert.equal(result.binding, 'CHANGED_OR_UNREADABLE'); assert.equal(result.status, 'UNVERIFIED');
  plan.checks[0] = command('const fs=require("fs");const p=JSON.parse(fs.readFileSync("plan.json"));p.checks[0].expected="changed";fs.writeFileSync("plan.json",JSON.stringify(p));console.log("observed: 42")'); await save();
  const changedPlan = await run(); assert.notEqual(changedPlan.planHash, changedPlan.planHashAfter); assert.equal(changedPlan.status, 'UNVERIFIED');
}));

test('helper source changes invalidate evidence even when all declared project files remain identical', async () => fixture(async ({ root }) => {
  const bytes = await readFile(helper); const copy = join(root, 'helper.mjs'); await writeFile(copy, bytes);
  const local = await import(pathToFileURL(copy).href);
  const result = await local.runPlan(root, 'plan.json', { approval: (await local.inspectPlan(root, 'plan.json')).planHash });
  assert.equal((await local.checkEvidence(root, 'plan.json', result.resultPath)).current, true);
  await writeFile(copy, Buffer.concat([bytes, Buffer.from('\n// later edit\n')]));
  assert.equal((await local.checkEvidence(root, 'plan.json', result.resultPath)).current, false);
}));

test('missing logs and incomplete observation records cannot be reused as success', async () => fixture(async ({ root, run }) => {
  const result = await run(); await rm(join(root, result.checks[0].stdout.path));
  assert.equal((await checkEvidence(root, 'plan.json', result.resultPath)).current, false);
  const other = await run(); other.checks = []; await writeFile(join(root, other.resultPath), JSON.stringify(other));
  assert.equal((await checkEvidence(root, 'plan.json', other.resultPath)).current, false);
  const altered = await run(); await writeFile(join(root, altered.checks[0].stdout.path), 'tampered');
  assert.equal((await checkEvidence(root, 'plan.json', altered.resultPath)).current, false);
}));

test('escaped/unreadable paths, shell scripts and artifact overlap are rejected', async () => {
  for (const change of [p => { p.targets = ['../outside']; }, p => { p.targets = ['missing']; }, p => { p.targets = ['.']; }, p => { p.artifactDir = 'canon/output'; }, p => { p.checks[0].command.cwd = '..'; }, p => { p.checks[0].command.executable = 'npm.cmd'; }]) {
    await fixture(async ({ root, plan, save, run }) => { change(plan); await save(); assert.ok((await inspectPlan(root, 'plan.json')).errors.length); assert.equal((await run()).executed, false); });
  }
});

test('verification rejects workspace-external directory links before reading targets or writing logs', async t => fixture(async ({ root, plan, save, run }) => {
  const external = await mkdtemp(join(tmpdir(), 'verification-outside-'));
  try {
    await writeFile(join(external, 'private.txt'), 'outside');
    try { await symlink(external, join(root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir'); }
    catch (error) { if (['EPERM', 'EACCES', 'ENOSYS'].includes(error.code)) { t.skip(`directory link unavailable: ${error.code}`); return; } throw error; }
    plan.targets = ['linked']; await save(); assert.equal((await run()).executed, false);
    plan.targets = ['src']; plan.artifactDir = 'linked/logs'; await save(); assert.equal((await run()).executed, false);
    assert.deepEqual(await readdir(external), ['private.txt']);
  } finally { await rm(external, { recursive: true, force: true }); }
}));
