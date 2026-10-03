import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, cp, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const root=resolve(import.meta.dirname,'../..');
const exec=promisify(execFile);
async function allFiles(dir,prefix=''){
  const result=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const path=prefix?`${prefix}/${entry.name}`:entry.name;
    if(entry.isDirectory())result.push(...await allFiles(join(dir,entry.name),path));
    else if(entry.isFile())result.push(path);
  }
  return result.sort();
}
test('release package surface and version metadata are coherent',async()=>{
  const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
  const installed=JSON.parse(await readFile(join(root,'template/tooling/governance/version.json'),'utf8'));
  assert.equal(pkg.private,true);
  assert.equal(pkg.version,'0.2.0');
  assert.equal(installed.distribution_version,pkg.version);
  assert.equal(installed.governance_version,'1.0.0');
  assert.equal(installed.checker_version,'0.1.0');
  assert.deepEqual(pkg.files,[
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
    'adoption/',
    'core/',
    'release/RELEASE.md',
    'release/RELEASE-NOTES-0.2.0.md',
    'template/',
    'tooling/'
  ]);
  const changelog=await readFile(join(root,'CHANGELOG.md'),'utf8');
  const notes=await readFile(join(root,'release/RELEASE-NOTES-0.2.0.md'),'utf8');
  assert.match(changelog,/^## 0\.2\.0$/m);
  assert.match(notes,/Governance semantics: \*\*1\.0\.0\*\*/);
  assert.match(notes,/Distribution: \*\*0\.2\.0\*\*/);
  assert.match(notes,/npm registry publication: \*\*out of scope\*\*/);
});
test('template normative copies exactly match Core',async()=>{
  for(const name of ['SPEC.md',...['decision','constraint','open-question','task','state'].map(x=>`schemas/${x}-v1.md`)])
    assert.deepEqual(await readFile(join(root,'core',name)),await readFile(join(root,'template/governance',name)),name);
});
test('installed operating guidance and helpers exactly match their sources',async()=>{
  for(const [source,target] of [
    ['adoption/OPERATIONS.md','template/governance/OPERATIONS.md'],
    ['tooling/preflight/preflight.mjs','template/tooling/governance/preflight.mjs'],
    ['tooling/context/context.mjs','template/tooling/governance/context.mjs']
  ])assert.deepEqual(await readFile(join(root,source)),await readFile(join(root,target)),target);
});
test('reusable files have no reference-project leakage',async()=>{
  const needles=['ReDiscovery','Judge','Reveal','Conway','Supabase','Next.js','pnpm','CarlosKim-1997'];
  const paths=['core/SPEC.md','template/AGENTS.md','template/governance/README.md','adoption/OPERATIONS.md','tooling/check/check.mjs','tooling/init/init.mjs','tooling/preflight/preflight.mjs','tooling/context/context.mjs'];
  for(const path of paths){const content=await readFile(join(root,path),'utf8');for(const needle of needles)assert.ok(!content.includes(needle),`${path}: ${needle}`)}
});
test('distribution manifest hashes match bytes',async()=>{
  await exec(process.execPath,['tooling/release-manifest.mjs'],{cwd:root});
  const manifest=JSON.parse(await readFile(join(root,'dist/development/distribution-manifest.json'),'utf8'));
  assert.equal(manifest.schema,'governance-distribution-manifest/v1');
  assert.equal(manifest.source_commit,'DEVELOPMENT_WORKTREE');
  assert.equal(manifest.distribution_version,'0.2.0');
  assert.equal(manifest.governance_version,'1.0.0');
  assert.equal(manifest.checker_version,'0.1.0');
  const paths=new Set(manifest.artifacts.map(x=>x.path));
  for(const path of await allFiles(join(root,'template'),'template'))assert.ok(paths.has(path),`missing installed file: ${path}`);
  assert.equal(manifest.artifacts.length,28);
  for(const artifact of manifest.artifacts){
    const actual=createHash('sha256').update(await readFile(join(root,artifact.path))).digest('hex');
    assert.equal(artifact.sha256,actual,artifact.path);
  }
  const sums=await readFile(join(root,'dist/development/SHA256SUMS'),'utf8');
  for(const artifact of manifest.artifacts)assert.ok(sums.includes(`${artifact.sha256}  ${artifact.path}\n`));
});
test('release metadata uses a clean committed source outside the source tree',async()=>{
  const fixture=await mkdtemp(join(tmpdir(),'governance-release-'));
  try {
    for(const name of ['core','template','adoption'])await cp(join(root,name),join(fixture,name),{recursive:true});
    await mkdir(join(fixture,'tooling'),{recursive:true});
    await cp(join(root,'tooling/release-manifest.mjs'),join(fixture,'tooling/release-manifest.mjs'));
    await mkdir(join(fixture,'tooling/init'),{recursive:true});
    await cp(join(root,'tooling/init/init.mjs'),join(fixture,'tooling/init/init.mjs'));
    await writeFile(join(fixture,'.gitignore'),'dist/\n');
    for(const args of [['init'],['add','-A'],['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture']])await exec('git',args,{cwd:fixture});
    const sha=(await exec('git',['rev-parse','HEAD'],{cwd:fixture})).stdout.trim();
    await exec(process.execPath,['tooling/release-manifest.mjs','--release'],{cwd:fixture});
    const manifest=JSON.parse(await readFile(join(fixture,'dist/release/distribution-manifest.json'),'utf8'));
    assert.equal(manifest.source_commit,sha);
    assert.equal((await exec('git',['status','--porcelain'],{cwd:fixture})).stdout.trim(),'');
    await writeFile(join(fixture,'template/AGENTS.md'),'modified');
    await assert.rejects(exec(process.execPath,['tooling/release-manifest.mjs','--release'],{cwd:fixture}),/clean committed source tree/);
  } finally { await rm(fixture,{recursive:true,force:true}); }
});
