// Independent follow-up regression. Run from the Repository Governance source root:
// node --test --test-reporter=tap /path/to/tap_identity_regression.test.mjs
// Optional RG_REVIEW_ROOT points to a different source root.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const sourceRoot = resolve(process.env.RG_REVIEW_ROOT ?? process.cwd());
const { inspectPlan, runPlan, checkEvidence } = await import(pathToFileURL(join(sourceRoot, 'tooling/verify/verify.mjs')).href);
async function verifyFixture(path, content, expectedStatus, cwd = '.') {
  const root = await mkdtemp(join(tmpdir(), 'rg-tap-identity-'));
  try {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
    const plan = {
      format: 'verification-plan/local-v1',
      requirement: { source: 'independent fixture', scope: 'Distinguish TAP file wrappers from actual named test cases' },
      targets: ['tests'], artifactDir: '.runs',
      checks: [{ label: 'native-node-test', kind: 'command', inputs: path,
        expected: 'Only real named cases may establish SATISFIED; empty files stay UNVERIFIED',
        basis: content === '' ? 'The executed file contains exactly zero bytes and no tests' : 'The executed file contains one explicit node:test case',
        failure: 'An empty wrapper is mistaken for an actual test case',
        permissions: 'Local disposable fixture only',
        command: { executable: 'node', args: ['--test', '--test-reporter=tap', cwd === 'tests' ? './' + path.slice('tests/'.length) : path], cwd },
        timeoutMs: 5000, maxOutputBytes: 32768, assertions: { exitCode: 0, testSummary: 'node-tap' }
      }]
    };
    await writeFile(join(root, 'plan.json'), JSON.stringify(plan));
    const inspected = await inspectPlan(root, 'plan.json');
    assert.deepEqual(inspected.errors, []);
    const result = await runPlan(root, 'plan.json', { approval: inspected.planHash });
    const checked = await checkEvidence(root, 'plan.json', result.resultPath);
    assert.deepEqual(
      { run: result.status, recheck: checked.status, current: checked.current, semantic: checked.semanticAcceptance },
      { run: expectedStatus, recheck: expectedStatus, current: true, semantic: 'UNVERIFIED' },
      `Unexpected TAP classification for ${JSON.stringify(path)}`
    );
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('empty regular file whose name contains # must not be SATISFIED', () =>
  verifyFixture('tests/empty#case.mjs', '', 'UNVERIFIED'));
test('empty regular file below a directory containing # must not be SATISFIED', () =>
  verifyFixture('tests/group#1/empty.mjs', '', 'UNVERIFIED'));
test('ordinary empty file with spaces still remains UNVERIFIED', () =>
  verifyFixture('tests/empty file.mjs', '', 'UNVERIFIED'));
test('a genuine named test containing # remains supported', () =>
  verifyFixture('tests/genuine.mjs', 'import {test} from "node:test";import assert from "node:assert/strict";test("calculation #1",()=>assert.equal(6*7,42));', 'SATISFIED'));
test('a genuine ordinary named test below a # directory remains supported', () =>
  verifyFixture('tests/group#1/genuine.mjs', 'import {test} from "node:test";import assert from "node:assert/strict";test("calculation",()=>assert.equal(6*7,42));', 'SATISFIED'));

test('leading spaces in a cwd-relative empty filename are not trimmed into a false case', () =>
  verifyFixture('tests/ empty.mjs', '', 'UNVERIFIED', 'tests'));
