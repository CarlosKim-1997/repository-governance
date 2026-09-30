import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { checkGovernance } from '../../tooling/check/check.mjs';

const exec=promisify(execFile);
const template=resolve(import.meta.dirname,'../../template');

async function fixture(fn){
  const root=await mkdtemp(join(tmpdir(),'governance-replay-'));
  try { await cp(template,root,{recursive:true}); await fn(root); }
  finally { await rm(root,{recursive:true,force:true}); }
}

async function put(root,path,content){
  const target=join(root,path);
  await mkdir(join(target,'..'),{recursive:true});
  await writeFile(target,content);
}

async function checkPass(root){
  const result=await checkGovernance(root);
  assert.equal(result.level,'PASS',JSON.stringify(result.findings,null,2));
}

function task(id,authority,verification){
  return [
    '---',
    'schema: task/v1',
    'id: '+id,
    'status: COMPLETE',
    'areas:',
    '  - global',
    '---',
    '# '+id,
    '',
    '## Objective',
    '',
    'Replay fixture.',
    '',
    '## Scope',
    '',
    'Bounded replay work only.',
    '',
    '## Authority',
    '',
    authority,
    '',
    '## Constraints',
    '',
    'Governance 1.0.0 remains binding.',
    '',
    '## Verification',
    '',
    verification,
    '',
    '## Stop Conditions',
    '',
    'Stop on authority ambiguity.',
    '',
    '## Completion Criteria',
    '',
    'Fixture expectation is represented without new protocol semantics.',
    ''
  ].join('\n');
}

function decision(id,text,relatedTo){
  const fm=[
    '---',
    'schema: decision/v1',
    'id: '+id,
    'status: ACTIVE',
    'areas:',
    '  - global'
  ];
  if(relatedTo)fm.push('related_to:','  - '+relatedTo);
  return [
    ...fm,
    '---',
    '# '+id,
    '',
    '## Decision',
    '',
    text,
    '',
    '## Context',
    '',
    'Replay fixture.',
    '',
    '## Rationale',
    '',
    'Preserve durable coordination truth.',
    '',
    '## Consequences',
    '',
    'Later implementation state is recorded outside this Decision.',
    ''
  ].join('\n');
}

test('R1 terminal Task preserves historical Authority after later human merge',async()=>fixture(async root=>{
  const path='work/tasks/T-001.md';
  await put(root,path,task(
    'T-001',
    'Authorized to implement, commit, and push on feature/r1. Not authorized to merge.',
    'Implementation completed. A human later merged the branch through PR #1.'
  ));
  await checkPass(root);
  const text=await readFile(join(root,path),'utf8');
  assert.match(text,/Not authorized to merge\./);
  assert.match(text,/human later merged/);
  const authority=text.split('## Authority\n\n')[1].split('\n\n## Constraints')[0];
  assert.doesNotMatch(authority,/Integrated|Merged|merge commit/i);
}));

test('R2 human integration can remain provenance without forcing Current State mutation',async()=>fixture(async root=>{
  const statePath=join(root,'canon/state/current.md');
  const before=await readFile(statePath,'utf8');
  await put(root,'work/tasks/T-002.md',task(
    'T-002',
    'Authorized to implement and push on feature/r2. Not authorized to merge.',
    'Feature verification passed before Task closure.'
  ));
  await put(root,'work/reports/r2-integration.md','# R2 integration provenance\n\nA human later merged the completed feature branch. This report is provenance, not authority.\n');
  await checkPass(root);
  const after=await readFile(statePath,'utf8');
  assert.equal(after,before);
}));

test('R3 ten completed milestones do not require State to become a milestone registry',async()=>fixture(async root=>{
  for(let i=1;i<=10;i++){
    const id='T-'+String(i).padStart(3,'0');
    await put(root,'work/tasks/'+id+'.md',task(
      id,
      'Authorized only for replay milestone '+i+'; no integration authority.',
      'Milestone '+i+' verification is recoverable in this Task.'
    ));
  }
  const state=[
    '---','schema: state/v1','status: READY','areas:','  - global','---',
    '# Current Project State','',
    '## Current Position','','Ten replay milestones are closed. No implementation episode is active.','',
    '## Active Work','','None.','',
    '## Blockers','','None.','',
    '## Material Risks','','None identified by this replay.','',
    '## Verification Basis','','Closed Task records preserve detailed milestone verification; this State records only the current position.',''
  ].join('\n');
  await put(root,'canon/state/current.md',state);
  await checkPass(root);
  const actual=await readFile(join(root,'canon/state/current.md'),'utf8');
  assert.ok(actual.split('\n').length < 35);
  for(let i=1;i<=10;i++)assert.doesNotMatch(actual,new RegExp('T-'+String(i).padStart(3,'0')));
}));

test('R4 transient implementation status can live outside durable Decision text',async()=>fixture(async root=>{
  await put(root,'canon/decisions/D-001.md',decision(
    'D-001',
    'Creator identity must remain provider-neutral; no external provider identity may become the durable owner key.'
  ));
  await put(root,'work/tasks/T-004.md',task(
    'T-004',
    'Authorized to explore authentication implementation only; not authorized to change D-001.',
    'At this milestone authentication was not implemented yet.'
  ));
  await put(root,'canon/decisions/D-002.md',decision(
    'D-002',
    'Authenticated external subjects map to stable internal Creator identities while D-001 provider-neutral ownership remains binding.',
    'D-001'
  ));
  await checkPass(root);
  const d1=await readFile(join(root,'canon/decisions/D-001.md'),'utf8');
  assert.doesNotMatch(d1,/not implemented|not yet|for now|currently unavailable/i);
  const t=await readFile(join(root,'work/tasks/T-004.md'),'utf8');
  assert.match(t,/not implemented yet/i);
}));

test('R5 rich hosted evidence can remain in Work while State keeps a representative basis',async()=>fixture(async root=>{
  const report=[
    '# Hosted verification report','',
    'Observed runs:',
    '- Run #105: failed stale fixture',
    '- Run #106: failed stale fixture',
    '- Run #107: success on repair head aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    '- Run #108: success on reconciliation head bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','',
    'The external CI system remains the live observation source for current workflow health.',''
  ].join('\n');
  await put(root,'work/reports/r5-hosted-evidence.md',report);
  const state=[
    '---','schema: state/v1','status: READY','areas:','  - global','---',
    '# Current Project State','',
    '## Current Position','','Repository repair is complete; no repair work is active.','',
    '## Active Work','','None.','',
    '## Blockers','','None.','',
    '## Material Risks','','Future hosted regressions remain possible.','',
    '## Verification Basis','',
    'Representative repository verification: reconciliation head bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb passed hosted deterministic verification. Detailed run history is preserved in work/reports/r5-hosted-evidence.md; live workflow health remains externally observed.',''
  ].join('\n');
  await put(root,'canon/state/current.md',state);
  await checkPass(root);
  const actual=await readFile(join(root,'canon/state/current.md'),'utf8');
  assert.doesNotMatch(actual,/Run #105|Run #106|Run #107|Run #108/);
  assert.match(actual,/Representative repository verification/);
}));

test('R6 plain Git facts distinguish reference and mutation worktrees before write',async()=>{
  const root=await mkdtemp(join(tmpdir(),'governance-workspace-replay-'));
  const repoDir=join(root,'repo');
  const worktree=join(root,'mutation');
  try{
    await mkdir(repoDir,{recursive:true});
    await exec('git',['init','-b','main'],{cwd:repoDir});
    await exec('git',['config','user.name','Replay'],{cwd:repoDir});
    await exec('git',['config','user.email','replay@example.invalid'],{cwd:repoDir});
    await writeFile(join(repoDir,'README.md'),'baseline\n');
    await exec('git',['add','README.md'],{cwd:repoDir});
    await exec('git',['commit','-m','baseline'],{cwd:repoDir});
    const baseline=(await exec('git',['rev-parse','HEAD'],{cwd:repoDir})).stdout.trim();

    await exec('git',['worktree','add','-b','replay-mutation',worktree,baseline],{cwd:repoDir});
    await writeFile(join(worktree,'change.txt'),'mutation\n');
    await exec('git',['add','change.txt'],{cwd:worktree});
    await exec('git',['commit','-m','mutation'],{cwd:worktree});
    const mutationHead=(await exec('git',['rev-parse','HEAD'],{cwd:worktree})).stdout.trim();

    const rootTop=(await exec('git',['rev-parse','--show-toplevel'],{cwd:repoDir})).stdout.trim();
    const wtTop=(await exec('git',['rev-parse','--show-toplevel'],{cwd:worktree})).stdout.trim();
    const rootBranch=(await exec('git',['branch','--show-current'],{cwd:repoDir})).stdout.trim();
    const wtBranch=(await exec('git',['branch','--show-current'],{cwd:worktree})).stdout.trim();
    const rootHead=(await exec('git',['rev-parse','HEAD'],{cwd:repoDir})).stdout.trim();
    const rootClean=(await exec('git',['status','--porcelain'],{cwd:repoDir})).stdout.trim();
    const list=(await exec('git',['worktree','list','--porcelain'],{cwd:repoDir})).stdout;

    assert.equal(rootTop,repoDir);
    assert.equal(wtTop,worktree);
    assert.equal(rootBranch,'main');
    assert.equal(wtBranch,'replay-mutation');
    assert.equal(rootHead,baseline);
    assert.notEqual(mutationHead,baseline);
    assert.equal(rootClean,'');
    assert.match(list,new RegExp(baseline));
    assert.match(list,new RegExp(mutationHead));
    assert.match(list,/branch refs\/heads\/main/);
    assert.match(list,/branch refs\/heads\/replay-mutation/);
  } finally {
    await rm(root,{recursive:true,force:true});
  }
});
