import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, readFile, writeFile, mkdir, mkdtemp, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createReleaseStaging, releasePackagePaths } from '../../tooling/release-package.mjs';

const root = resolve(import.meta.dirname, '../..'), exec = promisify(execFile);
test('latest-main staged archive installs into fresh Git-free Node/Python consumers and runs/checks installed verification', async () => {
  // macOS tmpdir may use /var, an alias for /private/var. Invoke installed
  // native files through their actual paths, consistent with helper preflight.
  const fixture = await realpath(await mkdtemp(join(tmpdir(), 'verification-packaged-')));
  try {
    const staging = join(fixture, 'staging'); await createReleaseStaging(root, staging);
    const metadata = JSON.parse(await readFile(join(staging, 'package.json'), 'utf8'));
    assert.equal(metadata.version, '0.3.0'); assert.equal(metadata.private, true);
    assert.deepEqual(Object.keys(metadata.scripts), ['build', 'check:template', 'preflight', 'context', 'verify']);
    assert.ok(releasePackagePaths.includes('tooling/verify'));
    const npmCli = process.env.npm_execpath ?? join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
    const env = { ...process.env, npm_config_cache: join(fixture, 'npm-cache') };
    const packed = JSON.parse((await exec(process.execPath, [npmCli, 'pack', staging, '--ignore-scripts', '--offline', '--json', '--pack-destination', fixture], { cwd: fixture, env })).stdout)[0];
    for (const name of ['adoption/VERIFICATION.md', 'tooling/verify/verify.mjs', 'tooling/verify/verification-plan.example.json', 'template/tooling/governance/verify.mjs']) assert.ok(packed.files.some(file => file.path === name), name);
    for (const file of packed.files) assert.ok(!/(^|\/)(tests|examples|work|dist|node_modules|\.github)(\/|$)|\.log$/.test(file.path), file.path);
    const harness = join(fixture, 'harness'); await mkdir(harness); await writeFile(join(harness, 'package.json'), '{"private":true}');
    // Install the actual archive. Supply the already-installed, lock-matched yaml
    // as a local dependency so the smoke neither needs a registry nor a new version.
    await exec(process.execPath, [npmCli, 'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', '--prefix', harness, join(fixture, packed.filename), join(root, 'node_modules/yaml')], { cwd: fixture, env, maxBuffer: 1024 * 1024 });
    const distribution = join(harness, 'node_modules/repository-governance');
    assert.deepEqual(await readFile(join(distribution, 'tooling/verify/verify.mjs')), await readFile(join(root, 'tooling/verify/verify.mjs')));
    for (const language of ['node', 'python']) {
      const consumer = join(fixture, language); await mkdir(consumer);
      if (language === 'python') await cp(join(root, 'tests/fixtures/python-utility'), consumer, { recursive: true });
      else {
        await mkdir(join(consumer, 'tests'));
        await writeFile(join(consumer, 'tests/sum.mjs'), 'import {test} from "node:test";import assert from "node:assert/strict";test("sum",()=>assert.equal(5-2,3));');
      }
      const installed = JSON.parse((await exec(process.execPath, [join(distribution, 'tooling/init/init.mjs'), 'init', '--greenfield', '--target', consumer, '--apply'])).stdout);
      assert.equal(installed.result, 'INSTALLED_VERIFIED');
      const plan = JSON.parse(await readFile(join(consumer, 'tooling/governance/verification-plan.example.json'), 'utf8'));
      plan.requirement = { source: language === 'python' ? 'ledger/cli.py' : 'tests/sum.mjs', scope: 'fixture 5 - 2 = 3' };
      plan.targets = language === 'python' ? ['ledger', 'tests', 'pyproject.toml'] : ['tests'];
      const check = plan.checks[0];
      if (language === 'python') { check.command = { executable: 'python', args: ['-B', '-m', 'unittest', 'discover', '-s', 'tests', '-v'], cwd: '.' }; check.assertions = { exitCode: 0, stderrIncludes: ['Ran 1 test', 'OK'] }; }
      else { check.command.args = ['--test', '--test-reporter=tap', 'tests/sum.mjs']; check.assertions = { exitCode: 0, testSummary: 'node-tap' }; }
      await writeFile(join(consumer, 'plan.json'), JSON.stringify(plan));
      const helper = join(consumer, 'tooling/governance/verify.mjs');
      const planned = JSON.parse((await exec(process.execPath, [helper, 'plan.json'], { cwd: consumer })).stdout);
      const result = JSON.parse((await exec(process.execPath, [helper, 'plan.json', '--run', '--approve', planned.planHash], { cwd: consumer })).stdout);
      assert.equal(result.status, 'SATISFIED'); assert.equal(result.gitBefore.available, false); assert.equal(result.semanticAcceptance, 'UNVERIFIED');
      assert.equal(JSON.parse((await exec(process.execPath, [helper, 'plan.json', '--check', result.resultPath], { cwd: consumer })).stdout).current, true);
      if (language === 'node') {
        // Exercise the repaired display identity through the installed CLI too.
        for (const name of ['empty#case.mjs', ' empty.mjs']) {
          await writeFile(join(consumer, 'tests', name), '');
          check.command = { executable: 'node', args: ['--test', '--test-reporter=tap', './' + name], cwd: 'tests' };
          await writeFile(join(consumer, 'plan.json'), JSON.stringify(plan));
          const inspected = JSON.parse((await exec(process.execPath, [helper, 'plan.json'], { cwd: consumer })).stdout);
          let observation;
          await assert.rejects(exec(process.execPath, [helper, 'plan.json', '--run', '--approve', inspected.planHash], { cwd: consumer }), error => {
            assert.equal(error.code, 1); observation = JSON.parse(error.stdout);
            assert.equal(observation.status, 'UNVERIFIED'); assert.equal(observation.semanticAcceptance, 'UNVERIFIED'); return true;
          });
          await assert.rejects(exec(process.execPath, [helper, 'plan.json', '--check', observation.resultPath], { cwd: consumer }), error => {
            assert.equal(error.code, 1); const checked = JSON.parse(error.stdout);
            assert.equal(checked.current, true); assert.equal(checked.status, 'UNVERIFIED'); return true;
          });
        }
      }
      await assert.rejects(readFile(join(consumer, 'node_modules/package.json')));
      assert.ok((await readFile(join(consumer, 'tooling/governance/preflight.mjs'))).length);
      assert.ok((await readFile(join(consumer, 'tooling/governance/context.mjs'))).length);
    }
  } finally { await rm(fixture, { recursive: true, force: true }); }
});
