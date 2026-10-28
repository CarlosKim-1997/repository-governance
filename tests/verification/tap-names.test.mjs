import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, sep } from 'node:path';
import { inspectPlan, runPlan, checkEvidence } from '../../tooling/verify/verify.mjs';

const named = name => `import {test} from 'node:test';import assert from 'node:assert/strict';test(${JSON.stringify(name)},()=>assert.equal(6*7,42));`;
async function verify(files, args, expected, cwd = '.', { rejectedPath } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'verification-tap-names-'));
  try {
    for (const [path, body] of Object.entries(files)) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), body);
    }
    const plan = {
      format: 'verification-plan/local-v1', requirement: { source: 'explicit fixtures', scope: 'TAP display/file identity' },
      targets: ['tests'], artifactDir: '.runs', checks: [{
        label: 'native node', kind: 'command', inputs: 'empty files or one arithmetic case',
        expected, basis: 'empty files have no cases; named cases assert 6 * 7 = 42', failure: 'display text misclassified',
        permissions: 'disposable local files only', command: {
          executable: 'node', args: ['--test', '--test-reporter', 'tap', '--', ...args.map(arg => typeof arg === 'function' ? arg(root) : arg)], cwd
        }, timeoutMs: 5000, maxOutputBytes: 32768, assertions: { exitCode: 0, testSummary: 'node-tap' }
      }]
    };
    await writeFile(join(root, 'plan.json'), JSON.stringify(plan));
    const inspected = await inspectPlan(root, 'plan.json');
    if (rejectedPath) {
      // Literal backslashes are valid POSIX filenames, but intentionally outside
      // this helper's portable workspace-path contract. Verify fail-closed
      // preflight without weakening that contract or skipping this case.
      assert.ok(inspected.errors.some(error =>
        error.includes(`expected a workspace-relative slash path: ${rejectedPath}`)),
      JSON.stringify(inspected.errors));
      const refused = await runPlan(root, 'plan.json', { approval: inspected.planHash });
      assert.equal(refused.status, 'BLOCKED');
      assert.equal(refused.executed, false);
      assert.ok(refused.errors.some(error =>
        error.includes(`expected a workspace-relative slash path: ${rejectedPath}`)));
      assert.equal((await readdir(root)).includes('.runs'), false);
      return;
    }
    assert.deepEqual(inspected.errors, []);
    const result = await runPlan(root, 'plan.json', { approval: inspected.planHash });
    assert.equal(result.checks[0].outcome, 'EXITED'); assert.equal(result.checks[0].exitCode, 0);
    const checked = await checkEvidence(root, 'plan.json', result.resultPath);
    assert.deepEqual({ run: result.status, check: checked.status, current: checked.current, semantic: checked.semanticAcceptance },
      { run: expected, check: expected, current: true, semantic: 'UNVERIFIED' });
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('combined hashes and meaningful directory/file whitespace remain file wrappers', async () => {
  const path = 'tests/ group##1 / empty##case.mjs';
  await verify({ [path]: '' }, ['./' + path], 'UNVERIFIED');
  await verify({ [path]: '' }, ['./ group##1 / empty##case.mjs'], 'UNVERIFIED', 'tests');
});

test('absolute and native separator arguments retain escaped wrapper identity', async () => {
  const path = 'tests/group#1/empty#case.mjs';
  await verify({ [path]: '' }, [root => resolve(root, path)], 'UNVERIFIED');
  await verify({ [path]: '' }, [path.split('/').join(sep)], 'UNVERIFIED');
  if (process.platform !== 'win32') {
    const path = 'tests/back\\slash#case.mjs';
    await verify({ [path]: '' }, [path], 'BLOCKED', '.', { rejectedPath: path });
  }
});

test('trailing filename whitespace is preserved in cwd-relative wrapper displays', () =>
  verify({ 'tests/empty.mjs ': '' }, ['./empty.mjs '], 'UNVERIFIED', 'tests'));

test('genuine names containing hashes, escaped backslashes and surrounding spaces still pass', () =>
  verify({ 'tests/ group#1 / genuine.mjs': named(' calculation \\#1 \\q ') }, ['tests/ group#1 / genuine.mjs'], 'SATISFIED'));

test('a named case displaying its own escaped invocation filename remains ambiguous', () =>
  verify({ 'tests/ same#case.mjs': named(' same#case.mjs') }, ['./ same#case.mjs'], 'UNVERIFIED', 'tests'));

test('Node control escapes and their literal-backslash aliases cannot establish named cases', async () => {
  for (const name of ['a\bb', 'a\fb', 'a\tb', 'a\nb', 'a\rb', 'a\vb', 'literal\\n', 'raw\u007fcontrol']) {
    await verify({ 'tests/genuine.mjs': named(name) }, ['tests/genuine.mjs'], 'UNVERIFIED');
  }
  if (process.platform !== 'win32') {
    for (const path of ['tests/empty\tfile.mjs', 'tests/empty\nfile.mjs']) await verify({ [path]: '' }, [path], 'UNVERIFIED');
  }
});

test('a genuine case still supplies an observation alongside escaped empty wrappers', () =>
  verify({ 'tests/empty#case.mjs': '', 'tests/genuine.mjs': named('calculation #1') }, ['tests/empty#case.mjs', 'tests/genuine.mjs'], 'SATISFIED'));

test('ambiguous escaped display stays unverified even alongside an ordinary named case', () =>
  verify({ 'tests/ambiguous.mjs': named('literal\\n'), 'tests/genuine.mjs': named('calculation') }, ['tests/ambiguous.mjs', 'tests/genuine.mjs'], 'UNVERIFIED'));
