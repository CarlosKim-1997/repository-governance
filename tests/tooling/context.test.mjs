import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { discoverContext } from '../../tooling/context/context.mjs';

const template=resolve(import.meta.dirname,'../../template');

async function put(root,path,content){
  const target=join(root,path);
  await mkdir(join(target,'..'),{recursive:true});
  await writeFile(target,content);
}

const constraint=(id,area)=>[
  '---','schema: constraint/v1','id: '+id,'status: ACTIVE','kind: HARD_CONSTRAINT','areas:','  - '+area,'---',
  '# '+id,'','## Constraint','','Boundary.','','## Rationale','','Fixture.','','## Operational Effect','','Preserve it.',''
].join('\n');

const decision=(id,area)=>[
  '---','schema: decision/v1','id: '+id,'status: ACTIVE','areas:','  - '+area,'---',
  '# '+id,'','## Decision','','Choice.','','## Context','','Fixture.','','## Rationale','','Fixture.','','## Consequences','','Preserve it.',''
].join('\n');

const task=(id)=>[
  '---','schema: task/v1','id: '+id,'status: READY','areas:','  - payments','related_to:','  - D-009','---',
  '# '+id,'','## Objective','','Fixture.','','## Scope','','Payments.','','## Authority','','Bounded.','','## Constraints','','Preserve authority.','','## Verification','','Not run.','','## Stop Conditions','','Stop on ambiguity.','','## Completion Criteria','','Done.',''
].join('\n');

test('context discovery is advisory and preserves direct cross-area references',async()=>{
  const root=await mkdtemp(join(tmpdir(),'governance-context-'));
  try{
    await cp(template,root,{recursive:true});
    const manifestPath=join(root,'governance/manifest.yaml');
    const manifest=(await readFile(manifestPath,'utf8')).replace(
      'areas:\n  - global',
      'areas:\n  - global\n  - payments\n  - robotics'
    );
    await writeFile(manifestPath,manifest);

    await put(root,'canon/constraints/C-001.md',constraint('C-001','global'));
    await put(root,'canon/constraints/C-002.md',constraint('C-002','payments'));
    await put(root,'canon/constraints/C-003.md',constraint('C-003','robotics'));
    await put(root,'canon/decisions/D-009.md',decision('D-009','robotics'));
    await put(root,'work/tasks/T-009.md',task('T-009'));

    const result=await discoverContext(root,'T-009');
    const selected=new Map(result.candidates.map(x=>[x.id,x]));
    assert.ok(selected.has('C-001'));
    assert.ok(selected.has('C-002'));
    assert.ok(selected.has('D-009'));
    assert.equal(selected.get('D-009').reasons.includes('direct-reference'),true);
    assert.equal(selected.has('C-003'),false);
    assert.equal(result.other_current_records.some(x=>x.id==='C-003'),true);
    assert.match(result.disclaimer,/Advisory discovery only/);
    assert.match(result.disclaimer,/Unloaded authoritative material may still apply/);
  } finally {
    await rm(root,{recursive:true,force:true});
  }
});

test('context discovery accepts a repository-relative record path',async()=>{
  const root=await mkdtemp(join(tmpdir(),'governance-context-path-'));
  try{
    await cp(template,root,{recursive:true});
    await put(root,'work/tasks/T-010.md',task('T-010').replace('D-009','T-010').replace('related_to:\n  - T-010\n',''));
    const result=await discoverContext(root,'work/tasks/T-010.md');
    assert.equal(result.target.id,'T-010');
    assert.equal(result.target.path,'work/tasks/T-010.md');
  } finally {
    await rm(root,{recursive:true,force:true});
  }
});
