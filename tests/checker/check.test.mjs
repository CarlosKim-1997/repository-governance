import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, writeFile, rm, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { checkGovernance } from '../../tooling/check/check.mjs';

const template=resolve(import.meta.dirname,'../../template');
async function fixture(fn) {
  const root=await mkdtemp(join(tmpdir(),'governance-check-'));
  try { await cp(template,root,{recursive:true}); await fn(root); }
  finally { await rm(root,{recursive:true,force:true}); }
}
const edit=async(root,path,change)=>{const p=join(root,path);await writeFile(p,change(await readFile(p,'utf8')))};
const record=(schema,id,status,extra='',headings)=>`---\nschema: ${schema}\nid: ${id}\nstatus: ${status}\nareas:\n  - global\n${extra}---\n# ${id}\n${headings.map(x=>`## ${x}\n\nText.\n`).join('\n')}`;
const decision=(id='D-001',extra='')=>record('decision/v1',id,'ACTIVE',extra,['Decision','Context','Rationale','Consequences']);
const task=(id='T-001',extra='')=>record('task/v1',id,'READY',extra,['Objective','Scope','Authority','Constraints','Verification','Stop Conditions','Completion Criteria']);
const constraint=(id='C-001',kind='HARD_CONSTRAINT',extra='')=>record('constraint/v1',id,'ACTIVE',`kind: ${kind}\n${extra}`,['Constraint','Rationale','Operational Effect']);
const oq=(id='OQ-001',status='OPEN',extra='')=>record('open-question/v1',id,status,extra,['Question','Why It Matters']);
async function put(root,path,content){await mkdir(join(root,path,'..'),{recursive:true});await writeFile(join(root,path),content)}
async function rules(root){return (await checkGovernance(root)).findings.map(x=>x.rule_id)}

test('valid empty Greenfield and warn-only metadata',async()=>fixture(async root=>{
  assert.equal((await checkGovernance(root)).level,'PASS');
  await put(root,'canon/decisions/D-001.md',decision('D-001','annotation: future\n'));
  const result=await checkGovernance(root);assert.equal(result.level,'WARN');assert.deepEqual(await rules(root),['GOV-SCHEMA-UNKNOWN']);
}));

const cases=[
  ['missing AGENTS',async r=>rm(join(r,'AGENTS.md')),'GOV-BOOT-MISSING'],
  ['missing manifest',async r=>rm(join(r,'governance/manifest.yaml')),'GOV-BOOT-MISSING'],
  ['invalid manifest',async r=>put(r,'governance/manifest.yaml','areas: [broken\n'),'GOV-SCHEMA-YAML'],
  ['unknown manifest field',async r=>edit(r,'governance/manifest.yaml',s=>s+'foo: bar\n'),'GOV-MANIFEST-UNKNOWN'],
  ['duplicate ID',async r=>{await put(r,'canon/decisions/a.md',decision());await put(r,'canon/decisions/b.md',decision())},'GOV-ID-DUPLICATE'],
  ['bad ID prefix',async r=>put(r,'canon/decisions/b.md',decision('T-123')),'GOV-ID-FORMAT'],
  ['ID kind mismatch',async r=>put(r,'canon/constraints/c.md',constraint('INV-001','HARD_CONSTRAINT')),'GOV-SCHEMA-KIND'],
  ['unknown area',async r=>put(r,'canon/decisions/d.md',decision().replace('  - global','  - unknown')),'GOV-AREA-INVALID'],
  ['duplicate area',async r=>put(r,'canon/decisions/d.md',decision().replace('  - global','  - global\n  - global')),'GOV-AREA-INVALID'],
  ['global plus local',async r=>{await edit(r,'governance/manifest.yaml',s=>s.replace('  - global','  - global\n  - app'));await put(r,'canon/decisions/d.md',decision().replace('  - global','  - global\n  - app'))},'GOV-AREA-INVALID'],
  ['broken relation',async r=>put(r,'canon/decisions/d.md',decision('D-001','depends_on: [C-999]\n')),'GOV-REL-MISSING'],
  ['wrong target',async r=>{await put(r,'canon/decisions/d.md',decision());await put(r,'work/tasks/t.md',task('T-001','depends_on: [D-001]\n'))},'GOV-REL-TARGET'],
  ['self reference',async r=>put(r,'work/tasks/t.md',task('T-001','depends_on: [T-001]\n')),'GOV-REL-SELF'],
  ['depends cycle',async r=>{await put(r,'canon/decisions/a.md',decision('D-001','depends_on: [D-002]\n'));await put(r,'canon/decisions/b.md',decision('D-002','depends_on: [D-001]\n'))},'GOV-GRAPH-DEPENDS'],
  ['Task execution cycle',async r=>{await put(r,'work/tasks/a.md',task('T-001','depends_on: [T-002]\n'));await put(r,'work/tasks/b.md',task('T-002','blocked_by: [T-001]\n'))},'GOV-GRAPH-TASK'],
  ['supersession cycle',async r=>{await put(r,'canon/decisions/a.md',decision('D-001','supersedes: [D-002]\n'));await put(r,'canon/decisions/b.md',decision('D-002','supersedes: [D-001]\n'))},'GOV-GRAPH-SUPERSEDES'],
  ['implements cycle',async r=>{await put(r,'canon/decisions/a.md',decision('D-001','implements: [D-002]\n'));await put(r,'canon/decisions/b.md',decision('D-002','implements: [D-001]\n'))},'GOV-GRAPH-IMPLEMENTS'],
  ['Project Invariant',async r=>put(r,'canon/constraints/c.md',constraint('INV-001','INVARIANT')),'GOV-SCHEMA-PROJECT-INV'],
  ['Invariant overridable',async r=>put(r,'governance/constraints/c.md',constraint('INV-001','INVARIANT','overridable: true\n')),'GOV-SCHEMA-OVERRIDABLE'],
  ['forbidden relation',async r=>put(r,'work/tasks/t.md',task('T-001','supersedes: [T-002]\n')),'GOV-REL-FORBIDDEN'],
  ['reverse alias',async r=>put(r,'canon/decisions/d.md',decision('D-001','blocks: [T-001]\n')),'GOV-REL-REVERSE'],
  ['reverse resolved alias',async r=>put(r,'canon/decisions/d.md',decision('D-001','resolved: D-002\n')),'GOV-REL-REVERSE'],
  ['invalid resolved_by list',async r=>put(r,'canon/open-questions/o.md',oq('OQ-001','RESOLVED','resolved_by: [D-001]\n')),'GOV-REL-RESOLUTION'],
  ['unsupported Evidence',async r=>put(r,'canon/open-questions/o.md',oq('OQ-001','RESOLVED','resolved_by: E-001\n')),'GOV-REL-RESOLUTION'],
  ['multiple State',async r=>cp(join(r,'canon/state/current.md'),join(r,'canon/state/old.md')),'GOV-STATE-SECOND'],
  ['unresolved OQ',async r=>put(r,'canon/open-questions/o.md',oq('OQ-001','RESOLVED')),'GOV-LIFE-RESOLUTION'],
];
for(const [name,change,rule] of cases)test(name,async()=>fixture(async root=>{await change(root);assert.ok((await rules(root)).includes(rule),name)}));

test('valid supersession and resolved OQ',async()=>fixture(async root=>{
  await put(root,'canon/decisions/old.md',decision('D-001').replace('status: ACTIVE','status: SUPERSEDED'));
  await put(root,'canon/decisions/new.md',decision('D-002','supersedes: [D-001]\n'));
  await put(root,'canon/open-questions/o.md',oq('OQ-001','RESOLVED','resolved_by: D-002\n'));
  assert.equal((await checkGovernance(root)).level,'PASS');
}));
test('ACTIVE Decision cannot supersede an ACTIVE Decision',async()=>fixture(async root=>{
  await put(root,'canon/decisions/old.md',decision('D-001'));
  await put(root,'canon/decisions/new.md',decision('D-002','supersedes: [D-001]\n'));
  assert.ok((await rules(root)).includes('GOV-LIFE-SUPERSESSION'));
}));
test('ACTIVE Constraint requires a SUPERSEDED Constraint target',async()=>fixture(async root=>{
  await put(root,'canon/constraints/old.md',constraint('C-001'));
  await put(root,'canon/constraints/new.md',constraint('C-002','HARD_CONSTRAINT','supersedes: [C-001]\n'));
  assert.ok((await rules(root)).includes('GOV-LIFE-SUPERSESSION'));
  await edit(root,'canon/constraints/old.md',s=>s.replace('status: ACTIVE','status: SUPERSEDED'));
  assert.equal((await checkGovernance(root)).level,'PASS');
}));
test('authoritative bootstrap symlinks cannot escape the repository',async t=>{
  const outside=await mkdtemp(join(tmpdir(),'governance-outside-'));
  try { await fixture(async root=>{
    for(const path of ['AGENTS.md','governance/manifest.yaml','governance/schemas/decision-v1.md','tooling/governance/check.mjs']){
      const target=join(root,path),external=join(outside,path.replaceAll('/','-'));
      await cp(target,external);await rm(target);
      try { await symlink(external,target,'file'); }
      catch(e) { if(['EPERM','EACCES','ENOTSUP'].includes(e.code)){t.skip(`file symlink unavailable: ${e.code}`);return;} throw e; }
      assert.ok((await rules(root)).includes('GOV-BOOT-ESCAPE'),path);
      await rm(target);await cp(external,target);
    }
  }); } finally { await rm(outside,{recursive:true,force:true}); }
});
test('structured collection symlink outside root is rejected before discovery',async t=>{
  const outside=await mkdtemp(join(tmpdir(),'governance-records-outside-'));
  try { await fixture(async root=>{
    await put(outside,'d.md',decision());
    const target=join(root,'canon/decisions');await rm(target,{recursive:true,force:true});
    try { await symlink(outside,target,'junction'); }
    catch(e) { if(['EPERM','EACCES','ENOTSUP'].includes(e.code)){t.skip(`directory link unavailable: ${e.code}`);return;} throw e; }
    const result=await checkGovernance(root);
    assert.ok(result.findings.some(x=>x.rule_id==='GOV-SCHEMA-PATH' && x.file==='canon/decisions'));
    assert.ok(!result.findings.some(x=>x.record_id==='D-001'));
  }); } finally { await rm(outside,{recursive:true,force:true}); }
});
test('linked bootstrap schema directory outside root is rejected',async t=>{
  const outside=await mkdtemp(join(tmpdir(),'governance-schemas-outside-'));
  try { await fixture(async root=>{
    const target=join(root,'governance/schemas');
    await cp(target,outside,{recursive:true});await rm(target,{recursive:true,force:true});
    try { await symlink(outside,target,'junction'); }
    catch(e) { if(['EPERM','EACCES','ENOTSUP'].includes(e.code)){t.skip(`directory link unavailable: ${e.code}`);return;} throw e; }
    const result=await checkGovernance(root);
    assert.ok(result.findings.some(x=>x.rule_id==='GOV-BOOT-ESCAPE' && x.file==='governance/schemas/decision-v1.md'));
  }); } finally { await rm(outside,{recursive:true,force:true}); }
});
