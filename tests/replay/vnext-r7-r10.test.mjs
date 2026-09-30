import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import YAML from 'yaml';
import { checkGovernance } from '../../tooling/check/check.mjs';

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

function packageDecision(id,status,terms,supersedes){
  const fm=[
    '---',
    'schema: decision/v1',
    'id: '+id,
    'status: '+status,
    'areas:',
    '  - global'
  ];
  if(supersedes)fm.push('supersedes:','  - '+supersedes);
  const rows=Object.entries(terms).map(([k,v])=>'- '+k+': '+v);
  return [
    ...fm,
    '---',
    '# '+id,
    '',
    '## Decision',
    '',
    ...rows,
    '',
    'This Decision is the complete current package for its lifecycle position; no unstated field-level inheritance is required.',
    '',
    '## Context',
    '',
    'Replay of a narrow operational package update.',
    '',
    '## Rationale',
    '',
    'Use existing whole-object supersession before adding amendment semantics.',
    '',
    '## Consequences',
    '',
    'Historical packages remain recoverable from superseded Decisions.',
    ''
  ].join('\n');
}

function task(id,{status='COMPLETE',implementsId,relatedTo,areas=['global'],authority,verification,stop}){
  const fm=[
    '---',
    'schema: task/v1',
    'id: '+id,
    'status: '+status,
    'areas:',
    ...areas.map(x=>'  - '+x)
  ];
  if(implementsId)fm.push('implements:','  - '+implementsId);
  if(relatedTo)fm.push('related_to:','  - '+relatedTo);
  return [
    ...fm,
    '---',
    '# '+id,
    '',
    '## Objective',
    '',
    'Replay fixture.',
    '',
    '## Scope',
    '',
    'Only the explicitly described replay action.',
    '',
    '## Authority',
    '',
    authority,
    '',
    '## Constraints',
    '',
    'Repository Governance 1.0.0 remains binding.',
    '',
    '## Verification',
    '',
    verification,
    '',
    '## Stop Conditions',
    '',
    stop,
    '',
    '## Completion Criteria',
    '',
    'The bounded action is closed without creating new normative semantics.',
    ''
  ].join('\n');
}

function constraint(id,areas,text){
  return [
    '---',
    'schema: constraint/v1',
    'id: '+id,
    'status: ACTIVE',
    'kind: HARD_CONSTRAINT',
    'areas:',
    ...areas.map(x=>'  - '+x),
    '---',
    '# '+id,
    '',
    '## Constraint',
    '',
    text,
    '',
    '## Rationale',
    '',
    'Replay fixture.',
    '',
    '## Operational Effect',
    '',
    'Workers must preserve this boundary.',
    ''
  ].join('\n');
}

function decision(id,areas,text,context,extra=[]){
  return [
    '---',
    'schema: decision/v1',
    'id: '+id,
    'status: ACTIVE',
    'areas:',
    ...areas.map(x=>'  - '+x),
    ...extra,
    '---',
    '# '+id,
    '',
    '## Decision',
    '',
    text,
    '',
    '## Context',
    '',
    context,
    '',
    '## Rationale',
    '',
    'Replay fixture.',
    '',
    '## Consequences',
    '',
    'This remains subject to applicable Constraints.',
    ''
  ].join('\n');
}

function frontmatter(text){
  const parts=text.split('---');
  return YAML.parse(parts[1]);
}

async function listMarkdown(dir){
  const result=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const path=join(dir,entry.name);
    if(entry.isDirectory())result.push(...await listMarkdown(path));
    else if(entry.isFile() && entry.name.endsWith('.md'))result.push(path);
  }
  return result;
}

async function advisoryContext(root,taskPath){
  const taskText=await readFile(join(root,taskPath),'utf8');
  const taskFm=frontmatter(taskText);
  const taskAreas=new Set(taskFm.areas||[]);
  const direct=new Set([
    ...(taskFm.implements||[]),
    ...(taskFm.related_to||[]),
    ...(taskFm.depends_on||[]),
    ...(taskFm.blocked_by||[])
  ]);
  const candidates=[];
  for(const rel of ['canon/decisions','canon/constraints','governance/constraints']){
    const dir=join(root,rel);
    let files=[];
    try { files=await listMarkdown(dir); } catch { continue; }
    for(const path of files){
      const text=await readFile(path,'utf8');
      const fm=frontmatter(text);
      const areas=fm.areas||[];
      const overlap=areas.includes('global') || areas.some(x=>taskAreas.has(x));
      if(overlap || direct.has(fm.id))candidates.push({id:fm.id,path,reason:direct.has(fm.id)?'direct-reference':'area-candidate'});
    }
  }
  return {
    candidates,
    disclaimer:'Advisory discovery only; unloaded authoritative material may still apply.'
  };
}

test('R7 whole-object supersession can represent repeated partial package changes without amendment semantics',async()=>fixture(async root=>{
  const base={
    content:'conway-v7',
    date:'2026-09-27',
    release_at:'2026-09-26T15:00:00Z',
    sequence:'3',
    model:'gpt-5.6-luna',
    budget:'64',
    warning:'16',
    phase_order:'A-B-C-D-E-F-G',
    broad_seed:'forbidden',
    publication:'explicit-human-approval'
  };
  const second={...base,date:'2026-09-28',release_at:'2026-09-27T15:00:00Z'};
  const third={...base,date:'2026-09-29',release_at:'2026-09-28T15:00:00Z'};

  await put(root,'canon/decisions/D-026.md',packageDecision('D-026','SUPERSEDED',base));
  await put(root,'canon/decisions/D-032.md',packageDecision('D-032','SUPERSEDED',second,'D-026'));
  await put(root,'canon/decisions/D-033.md',packageDecision('D-033','ACTIVE',third,'D-032'));
  await checkPass(root);

  const active=await readFile(join(root,'canon/decisions/D-033.md'),'utf8');
  for(const [key,value] of Object.entries(third)){
    assert.match(active,new RegExp(key.replaceAll('_','[_ ]')+'.*'+value.replace(/[.*+?^$()|[\]\\]/g,'\\$&')));
  }
  const files=await readdir(join(root,'canon/decisions'));
  assert.equal(files.length,3);
}));

test('R8 short-lived production approval can be bounded in Task Authority without a new authorization object',async()=>fixture(async root=>{
  await put(root,'canon/decisions/D-020.md',decision(
    'D-020',
    ['global'],
    'Production publication is permitted only under explicit human approval for the exact action and scope.',
    'Durable production safety policy.'
  ));
  await put(root,'work/tasks/T-008.md',task('T-008',{
    implementsId:'D-020',
    authority:'Human approval observed for exactly one production publication of artifact conway-v7 before 2026-10-01T00:00:00Z. No other production mutation, deployment, budget change, or publication is authorized.',
    verification:'The exact publication executed once at 2026-09-30T03:00:00Z. No second mutation was performed.',
    stop:'Stop if the deadline passes before execution, if artifact identity changes, after one execution, or if any additional production mutation would be required.'
  }));
  await checkPass(root);

  const taskText=await readFile(join(root,'work/tasks/T-008.md'),'utf8');
  assert.match(taskText,/exactly one production publication/);
  assert.match(taskText,/before 2026-10-01T00:00:00Z/);
  assert.match(taskText,/after one execution/);
  const decisions=await readdir(join(root,'canon/decisions'));
  assert.deepEqual(decisions.sort(),['D-020.md']);
}));

test('R9 advisory context discovery finds global, overlapping-area, and direct-reference candidates without claiming completeness',async()=>fixture(async root=>{
  const manifestPath=join(root,'governance/manifest.yaml');
  const manifest=(await readFile(manifestPath,'utf8')).replace(
    'areas:\n  - global',
    'areas:\n  - global\n  - payments\n  - robotics'
  );
  await writeFile(manifestPath,manifest);

  await put(root,'canon/constraints/C-001.md',constraint('C-001',['global'],'Global safety boundary.'));
  await put(root,'canon/constraints/C-002.md',constraint('C-002',['payments'],'Payments boundary.'));
  await put(root,'canon/constraints/C-003.md',constraint('C-003',['robotics'],'Robotics boundary.'));
  await put(root,'canon/decisions/D-009.md',decision(
    'D-009',
    ['robotics'],
    'A robotics-specific choice that is directly referenced by the payments Task for replay.',
    'Direct-reference replay.'
  ));
  await put(root,'work/tasks/T-009.md',task('T-009',{
    status:'READY',
    areas:['payments'],
    relatedTo:'D-009',
    authority:'Authorized for payments replay only.',
    verification:'Not yet executed.',
    stop:'Stop on missing authority.'
  }));
  await checkPass(root);

  const result=await advisoryContext(root,'work/tasks/T-009.md');
  const ids=new Set(result.candidates.map(x=>x.id));
  assert.ok(ids.has('C-001'));
  assert.ok(ids.has('C-002'));
  assert.ok(ids.has('D-009'));
  assert.ok(!ids.has('C-003'));
  assert.match(result.disclaimer,/Advisory discovery only/);
  assert.match(result.disclaimer,/may still apply/);
}));

test('R10 human ratification provenance can remain readable prose without becoming validity-bearing schema',async()=>fixture(async root=>{
  await put(root,'canon/decisions/D-010.md',decision(
    'D-010',
    ['global'],
    'Receiver-visible summaries must remain grounded in approved canonical handoff items.',
    'Human ratification observed on 2026-09-30 in review event RG-R10-1. Canonicalization followed that approval.'
  ));
  await put(root,'work/reports/r10-ratification-provenance.md',[
    '# Ratification provenance',
    '',
    'Decision: D-010',
    'Event: RG-R10-1',
    'Observed action: human ratified the Decision before ACTIVE canonicalization.',
    'This report is provenance, not authority and not cryptographic proof.',
    ''
  ].join('\n'));
  await checkPass(root);

  const d=await readFile(join(root,'canon/decisions/D-010.md'),'utf8');
  const fm=frontmatter(d);
  assert.equal(fm.id,'D-010');
  assert.equal(fm.status,'ACTIVE');
  assert.equal(Object.hasOwn(fm,'ratified_by'),false);
  assert.equal(Object.hasOwn(fm,'ratified_at'),false);
  assert.match(d,/Human ratification observed/);
  const report=await readFile(join(root,'work/reports/r10-ratification-provenance.md'),'utf8');
  assert.match(report,/Decision: D-010/);
  assert.match(report,/provenance, not authority/);
}));
