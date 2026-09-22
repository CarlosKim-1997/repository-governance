import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, mkdir, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { planInit, applyInit, recognitionProfiles } from '../../tooling/init/init.mjs';

const exec=promisify(execFile);
async function fixture(fn){const root=await mkdtemp(join(tmpdir(),'governance-init-'));try{await fn(root)}finally{await rm(root,{recursive:true,force:true})}}

test('published Governance 1.0 recognition contract is unchanged',()=>{
  // Independent golden values: never derive these from the installer or template.
  assert.deepEqual(recognitionProfiles['1.0.0'],{
    requiredLandmarks:[
      'AGENTS.md','governance/README.md','governance/manifest.yaml','governance/SPEC.md',
      'governance/schemas/decision-v1.md','governance/schemas/constraint-v1.md',
      'governance/schemas/open-question-v1.md','governance/schemas/task-v1.md',
      'governance/schemas/state-v1.md','canon/principles/PROJECT.md',
      'tooling/governance/check.mjs','tooling/governance/version.json'
    ],
    supportedSchemas:['decision/v1','constraint/v1','open-question/v1','task/v1','state/v1']
  });
});

test('plan-only empty Greenfield, apply, idempotency and offline checker',async()=>fixture(async root=>{
  const plan=await planInit(root,'greenfield');
  assert.equal(plan.presence,'NO_GOVERNANCE');assert.equal(plan.blocked,false);
  assert.ok(plan.entries.every(x=>x.action==='CREATE'));
  const applied=await applyInit(root,'greenfield');assert.equal(applied.result,'INSTALLED_VERIFIED');
  assert.equal(applied.check.exit,0);
  assert.ok(Object.isFrozen(recognitionProfiles['1.0.0']));
  assert.ok(Object.isFrozen(recognitionProfiles['1.0.0'].requiredLandmarks));
  assert.equal((await planInit(root,'greenfield')).presence,'GOVERNANCE_INSTALLED');
  const second=await applyInit(root,'greenfield');assert.equal(second.result,'ALREADY_INSTALLED');
  assert.equal(second.created.length,0);
  const {stdout}=await exec(process.execPath,['tooling/governance/check.mjs'],{cwd:root});
  assert.match(stdout,/PASS/);
}));
test('project-owned State and Principles edits retain installed identity',async()=>fixture(async root=>{
  assert.equal((await applyInit(root,'greenfield')).result,'INSTALLED_VERIFIED');
  const statePath=join(root,'canon/state/current.md'), principlesPath=join(root,'canon/principles/PROJECT.md');
  const state=(await readFile(statePath,'utf8')).replace('status: NOT_READY','status: READY');
  const principles=(await readFile(principlesPath,'utf8'))+'\nA ratified project principle.\n';
  await writeFile(statePath,state);await writeFile(principlesPath,principles);
  await writeFile(join(root,'work/reports/notes.md'),'Project provenance.\n');
  const plan=await planInit(root,'greenfield');
  assert.equal(plan.presence,'GOVERNANCE_INSTALLED');assert.equal(plan.blocked,false);assert.equal(plan.upgrade_review_required,false);
  assert.equal((await applyInit(root,'greenfield')).result,'ALREADY_INSTALLED');
  assert.equal(await readFile(statePath,'utf8'),state);assert.equal(await readFile(principlesPath,'utf8'),principles);
}));
test('mixed AGENTS and manifest edits retain installed identity',async()=>fixture(async root=>{
  assert.equal((await applyInit(root,'greenfield')).result,'INSTALLED_VERIFIED');
  const agentsPath=join(root,'AGENTS.md'),manifestPath=join(root,'governance/manifest.yaml');
  const agents=(await readFile(agentsPath,'utf8'))+'\nProject-local router note.\n';
  const manifest=(await readFile(manifestPath,'utf8')).replace('  - global\n','  - global\n  - robotics\n');
  await writeFile(agentsPath,agents);await writeFile(manifestPath,manifest);
  const plan=await planInit(root,'brownfield');
  assert.equal(plan.presence,'GOVERNANCE_INSTALLED');assert.equal(plan.blocked,false);
  assert.equal(plan.upgrade_review_required,false);
  assert.equal(plan.entries.find(x=>x.path==='AGENTS.md').action,'EXISTS_DIFFERENT');
  assert.equal((await applyInit(root,'brownfield')).result,'ALREADY_INSTALLED');
  assert.equal(await readFile(agentsPath,'utf8'),agents);assert.equal(await readFile(manifestPath,'utf8'),manifest);
}));
test('older installed snapshot is not filled from a grown upstream template',async()=>fixture(async root=>{
  assert.equal((await applyInit(root,'greenfield')).result,'INSTALLED_VERIFIED');
  const newer=await mkdtemp(join(tmpdir(),'governance-template-'));
  try {
    await cp(new URL('../../template/',import.meta.url),newer,{recursive:true});
    await writeFile(join(newer,'governance/new-upstream-note.md'),'New upstream file.\n');
    await writeFile(join(newer,'governance/SPEC.md'),'Updated upstream Core.\n');
    await writeFile(join(newer,'governance/manifest.yaml'),(await readFile(join(newer,'governance/manifest.yaml'),'utf8')).replace('governance_version: 1.0.0','governance_version: 1.1.0'));
    const plan=await planInit(root,'greenfield',newer);
    assert.equal(plan.presence,'GOVERNANCE_INSTALLED');assert.equal(plan.blocked,false);assert.equal(plan.upgrade_review_required,true);
    assert.equal(plan.entries.find(x=>x.path==='governance/new-upstream-note.md').action,'UPSTREAM_MISSING_LOCALLY');
    assert.equal((await applyInit(root,'greenfield',newer)).result,'ALREADY_INSTALLED');
    await assert.rejects(readFile(join(root,'governance/new-upstream-note.md')));
    assert.notEqual(await readFile(join(root,'governance/SPEC.md'),'utf8'),'Updated upstream Core.\n');
  } finally { await rm(newer,{recursive:true,force:true}); }
}));
test('a simulated stricter future profile does not redefine a 1.0 snapshot',async()=>fixture(async root=>{
  assert.equal((await applyInit(root,'greenfield')).result,'INSTALLED_VERIFIED');
  const profiles={...recognitionProfiles,'1.1.0':{
    requiredLandmarks:[...recognitionProfiles['1.0.0'].requiredLandmarks,'governance/future-required.md'],
    supportedSchemas:[...recognitionProfiles['1.0.0'].supportedSchemas]
  }};
  const plan=await planInit(root,'greenfield',undefined,profiles);
  assert.equal(plan.presence,'GOVERNANCE_INSTALLED');
  assert.equal(plan.blocked,false);
  assert.equal(plan.upgrade_review_required,false);
  assert.equal((await applyInit(root,'greenfield',undefined,profiles)).result,'ALREADY_INSTALLED');
  await assert.rejects(readFile(join(root,'governance/future-required.md')));
}));
test('unsupported installed version is unknown and apply does not mutate it',async()=>fixture(async root=>{
  assert.equal((await applyInit(root,'greenfield')).result,'INSTALLED_VERIFIED');
  const manifestPath=join(root,'governance/manifest.yaml'), versionPath=join(root,'tooling/governance/version.json');
  const manifest=(await readFile(manifestPath,'utf8')).replace('governance_version: 1.0.0','governance_version: 9.9.9');
  const version=(await readFile(versionPath,'utf8')).replace('"governance_version": "1.0.0"','"governance_version": "9.9.9"');
  await writeFile(manifestPath,manifest);await writeFile(versionPath,version);
  const plan=await planInit(root,'greenfield');
  assert.equal(plan.presence,'GOVERNANCE_UNKNOWN');assert.equal(plan.blocked,true);
  assert.match(plan.note,/version 9\.9\.9 safely/);
  assert.equal((await applyInit(root,'greenfield')).result,'RECOVERY_REQUIRED');
  assert.equal(await readFile(manifestPath,'utf8'),manifest);
  assert.equal(await readFile(versionPath,'utf8'),version);
}));
test('manifest and version.json disagreement is not installed',async()=>fixture(async root=>{
  assert.equal((await applyInit(root,'greenfield')).result,'INSTALLED_VERIFIED');
  const path=join(root,'tooling/governance/version.json');
  const version=(await readFile(path,'utf8')).replace('"governance_version": "1.0.0"','"governance_version": "1.1.0"');
  await writeFile(path,version);
  const plan=await planInit(root,'greenfield');
  assert.equal(plan.presence,'PARTIAL_GOVERNANCE');assert.equal(plan.blocked,true);
  assert.equal((await applyInit(root,'greenfield')).result,'RECOVERY_REQUIRED');
  assert.equal(await readFile(path,'utf8'),version);
}));
test('missing required 1.0 schema landmark is partial',async()=>fixture(async root=>{
  assert.equal((await applyInit(root,'greenfield')).result,'INSTALLED_VERIFIED');
  const path=join(root,'governance/schemas/task-v1.md');
  await rm(path);
  const plan=await planInit(root,'greenfield');
  assert.equal(plan.presence,'PARTIAL_GOVERNANCE');assert.equal(plan.blocked,true);
  assert.equal((await applyInit(root,'greenfield')).result,'RECOVERY_REQUIRED');
  await assert.rejects(readFile(path));
}));
test('local Core modification remains installed and requires upgrade review',async()=>fixture(async root=>{
  assert.equal((await applyInit(root,'greenfield')).result,'INSTALLED_VERIFIED');
  const path=join(root,'governance/SPEC.md'),local=(await readFile(path,'utf8'))+'\nLocal governance note.\n';
  await writeFile(path,local);
  const plan=await planInit(root,'greenfield');
  assert.equal(plan.presence,'GOVERNANCE_INSTALLED');assert.equal(plan.blocked,false);assert.equal(plan.upgrade_review_required,true);
  assert.match(plan.note,/upgrade review/);
  assert.equal((await applyInit(root,'greenfield')).result,'ALREADY_INSTALLED');
  assert.equal(await readFile(path,'utf8'),local);
}));
test('missing selected State in an installed snapshot requires recovery',async()=>fixture(async root=>{
  assert.equal((await applyInit(root,'greenfield')).result,'INSTALLED_VERIFIED');
  await rm(join(root,'canon/state/current.md'));
  const plan=await planInit(root,'greenfield');assert.equal(plan.presence,'PARTIAL_GOVERNANCE');assert.equal(plan.blocked,true);
  assert.equal((await applyInit(root,'greenfield')).result,'RECOVERY_REQUIRED');
  await assert.rejects(readFile(join(root,'canon/state/current.md')));
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
  assert.equal(plan.blocked,true);
  assert.equal(plan.entries.find(x=>x.path==='governance/manifest.yaml').action,'EXISTS_IDENTICAL');
  assert.equal((await applyInit(root,'greenfield')).result,'RECOVERY_REQUIRED');
  assert.deepEqual(await readFile(join(root,'governance/manifest.yaml')),source);
  await assert.rejects(readFile(join(root,'AGENTS.md')));
}));
test('unknown Governance signals block apply without filling files',async()=>fixture(async root=>{
  await mkdir(join(root,'governance'),{recursive:true});
  await mkdir(join(root,'tooling/governance'),{recursive:true});
  const plan=await planInit(root,'brownfield');assert.equal(plan.presence,'GOVERNANCE_UNKNOWN');assert.equal(plan.blocked,true);
  assert.equal((await applyInit(root,'brownfield')).result,'RECOVERY_REQUIRED');
  await assert.rejects(readFile(join(root,'AGENTS.md')));
}));
test('generic work and canon directories are not Governance signals',async()=>fixture(async root=>{
  await mkdir(join(root,'work'),{recursive:true});await mkdir(join(root,'canon'),{recursive:true});
  const plan=await planInit(root,'greenfield');assert.equal(plan.presence,'NO_GOVERNANCE');assert.equal(plan.blocked,false);
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
