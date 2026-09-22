import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, mkdir, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { planInit, applyInit } from '../../tooling/init/init.mjs';

const exec=promisify(execFile);
async function fixture(fn){const root=await mkdtemp(join(tmpdir(),'governance-init-'));try{await fn(root)}finally{await rm(root,{recursive:true,force:true})}}

test('plan-only empty Greenfield, apply, idempotency and offline checker',async()=>fixture(async root=>{
  const plan=await planInit(root,'greenfield');
  assert.equal(plan.presence,'NO_GOVERNANCE');assert.equal(plan.blocked,false);
  assert.ok(plan.entries.every(x=>x.action==='CREATE'));
  const applied=await applyInit(root,'greenfield');assert.equal(applied.result,'INSTALLED_VERIFIED');
  assert.equal(applied.check.exit,0);
  const second=await applyInit(root,'greenfield');assert.equal(second.result,'ALREADY_INSTALLED');
  assert.equal(second.created.length,0);
  const {stdout}=await exec(process.execPath,['tooling/governance/check.mjs'],{cwd:root});
  assert.match(stdout,/PASS/);
}));
test('language neutral and Python project',async()=>fixture(async root=>{
  await writeFile(join(root,'README.txt'),'Research notes');
  await writeFile(join(root,'main.py'),'print("hello")\n');
  const result=await applyInit(root,'greenfield');assert.equal(result.result,'INSTALLED_VERIFIED');
  assert.equal(await readFile(join(root,'main.py'),'utf8'),'print("hello")\n');
}));
test('minimal Node project without installed dependencies',async()=>fixture(async root=>{
  await writeFile(join(root,'package.json'),'{}\n');
  const result=await applyInit(root,'greenfield');assert.equal(result.result,'INSTALLED_VERIFIED');
}));
test('unrelated Python utility fixture retains its source and passes installed checker',async()=>fixture(async root=>{
  await cp(new URL('../fixtures/python-utility/',import.meta.url),root,{recursive:true});
  const before=await readFile(join(root,'ledger/cli.py'));
  const result=await applyInit(root,'greenfield');assert.equal(result.result,'INSTALLED_VERIFIED');
  assert.deepEqual(await readFile(join(root,'ledger/cli.py')),before);
  assert.equal(result.check.exit,0);
}));
test('Brownfield skeleton does not assert adoption',async()=>fixture(async root=>{
  await writeFile(join(root,'legacy.md'),'old policy');
  const result=await applyInit(root,'brownfield');assert.match(result.result,/SKELETON INSTALLED/);
  assert.equal(result.check.exit,0);
  assert.equal(await readFile(join(root,'legacy.md'),'utf8'),'old policy');
}));
test('existing AGENTS and file collision are protected',async()=>fixture(async root=>{
  await writeFile(join(root,'AGENTS.md'),'human instructions');
  let plan=await planInit(root,'brownfield');assert.equal(plan.entries.find(x=>x.path==='AGENTS.md').action,'MERGE_REQUIRED');assert.equal(plan.blocked,true);
  assert.equal((await applyInit(root,'brownfield')).result,'CONFLICTED');
  assert.equal(await readFile(join(root,'AGENTS.md'),'utf8'),'human instructions');
  await mkdir(join(root,'governance'),{recursive:true});await writeFile(join(root,'governance/SPEC.md'),'local');
  plan=await planInit(root,'brownfield');assert.equal(plan.entries.find(x=>x.path==='governance/SPEC.md').action,'EXISTS_DIFFERENT');
}));
test('partial installation gets recovery plan',async()=>fixture(async root=>{
  await mkdir(join(root,'governance'),{recursive:true});
  const source=await readFile(new URL('../../template/governance/manifest.yaml',import.meta.url));
  await writeFile(join(root,'governance/manifest.yaml'),source);
  const plan=await planInit(root,'greenfield');assert.equal(plan.presence,'PARTIAL_GOVERNANCE');
  assert.equal(plan.entries.find(x=>x.path==='governance/manifest.yaml').action,'EXISTS_IDENTICAL');
  assert.equal((await applyInit(root,'greenfield')).result,'INSTALLED_VERIFIED');
}));
test('dirty nonconflicting Git tree does not prevent install',async()=>fixture(async root=>{
  await exec('git',['init'],{cwd:root});await writeFile(join(root,'notes.txt'),'unfinished');
  const plan=await planInit(root,'greenfield');
  assert.equal(plan.git.dirty,'DIRTY_NON_CONFLICTING');assert.equal(plan.blocked,false);
  assert.equal((await applyInit(root,'greenfield')).result,'INSTALLED_VERIFIED');
}));
test('dirty conflicting Git tree remains visible',async()=>fixture(async root=>{
  await exec('git',['init'],{cwd:root});
  await writeFile(join(root,'AGENTS.md'),'existing');
  const plan=await planInit(root,'greenfield');
  assert.equal(plan.entries.find(x=>x.path==='AGENTS.md').action,'MERGE_REQUIRED');
  assert.equal(plan.git.dirty,'DIRTY_CONFLICTING');
  assert.equal(plan.blocked,true);
}));
