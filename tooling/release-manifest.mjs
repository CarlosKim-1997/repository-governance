import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import process from 'node:process';

const root=resolve(import.meta.dirname,'..'), exec=promisify(execFile);
const release=process.argv.includes('--release');
if(process.argv.slice(2).some(arg=>arg!=='--release'))throw new Error('only --release is supported');
async function templateFiles(dir, prefix='template') {
  const paths=[];
  for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'))) {
    const path=`${prefix}/${entry.name}`;
    if(entry.isDirectory()) paths.push(...await templateFiles(join(dir,entry.name),path));
    else if(entry.isFile()) paths.push(path);
  }
  return paths;
}
async function cleanHead() {
  const status=(await exec('git',['status','--porcelain=v1','--untracked-files=all'],{cwd:root})).stdout.trim();
  if(status)throw new Error('release metadata requires a clean committed source tree');
  return (await exec('git',['rev-parse','HEAD'],{cwd:root})).stdout.trim();
}
const sourceCommit=release?await cleanHead():'DEVELOPMENT_WORKTREE';
const templateRecords=(await templateFiles(join(root,'template'))).map(path=>{
  const ownership=['template/AGENTS.md','template/governance/manifest.yaml'].includes(path)?'MIXED':path.startsWith('template/canon/')||path.startsWith('template/work/')?'PROJECT_OWNED':'UPSTREAM_OWNED';
  const klass=path.startsWith('template/tooling/')?'TOOLING':path==='template/governance/OPERATIONS.md'?'GUIDANCE':'TEMPLATE';
  return [path,klass,ownership];
});
const records=[
  ['core/SPEC.md','NORMATIVE','UPSTREAM_OWNED'],
  ...['decision','constraint','open-question','task','state'].map(x=>[`core/schemas/${x}-v1.md`,'NORMATIVE','UPSTREAM_OWNED']),
  ...templateRecords,
  ['tooling/init/init.mjs','TOOLING','UPSTREAM_OWNED'],
  ...['GREENFIELD','BROWNFIELD','FINAL-AUDIT','UPGRADE','OPERATIONS'].map(x=>[`adoption/${x}.md`,'GUIDANCE','UPSTREAM_OWNED'])
];
const artifacts=[];
for(const [path,klass,ownership] of records)artifacts.push({path,class:klass,ownership,sha256:createHash('sha256').update(await readFile(join(root,path))).digest('hex')});
if(release && sourceCommit!==await cleanHead())throw new Error('source commit changed during release metadata generation');
const manifest={schema:'governance-distribution-manifest/v1',distribution_version:'0.2.0',governance_version:'1.0.0',checker_version:'0.1.0',source_commit:sourceCommit,artifacts};
const output=join(root,'dist',release?'release':'development');
await mkdir(output,{recursive:true});
await writeFile(join(output,'distribution-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(join(output,'SHA256SUMS'),artifacts.map(x=>`${x.sha256}  ${x.path}`).join('\n')+'\n');
process.stdout.write(`Wrote ${artifacts.length} artifact hashes to ${output}; source ${sourceCommit}.\n`);
