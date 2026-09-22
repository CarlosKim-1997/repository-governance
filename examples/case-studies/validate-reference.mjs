// Disposable compatibility experiment; never mutates the source checkout.
import { cp, mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { checkGovernance } from '../../tooling/check/check.mjs';

const source=resolve(process.argv[2]??'.reference');
const template=resolve(import.meta.dirname,'../../template');
const root=await mkdtemp(join(tmpdir(),'governance-reference-'));
try {
  for(const path of ['AGENTS.md','governance','canon','work']) await cp(join(source,path),join(root,path),{recursive:true});
  await mkdir(join(root,'tooling/governance'),{recursive:true});
  for(const file of ['check.mjs','version.json']) await cp(join(template,'tooling/governance',file),join(root,'tooling/governance',file));
  const update=async(path,oldValue,newValue)=>{
    const file=join(root,path), content=await readFile(file,'utf8');
    if(!content.includes(oldValue))throw new Error(`expected text absent: ${path}`);
    await writeFile(file,content.replace(oldValue,newValue));
  };
  await update('canon/decisions/D-018.md','implements: [C-003]\n','');
  await update('canon/open-questions/OQ-001.md','resolved_by: [D-018]','resolved_by: D-018');
  await update('canon/state/current.md','areas: [global, analytics, privacy, identity]','areas: [global]');
  const result=await checkGovernance(root);
  for(const finding of result.findings)process.stdout.write(`${finding.severity} ${finding.rule_id} ${finding.file}: ${finding.message}\n`);
  process.stdout.write(`${result.level}: disposable reference compatibility experiment\n`);
  process.exitCode=result.level==='ERROR'?1:0;
} finally { await rm(root,{recursive:true,force:true}); }
