import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join, basename } from 'node:path';
import process from 'node:process';

const root=resolve(import.meta.dirname,'..');
const exec=promisify(execFile);
const out=join(root,'dist','release');

async function sha256(path){
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

async function cleanHead(){
  const status=(await exec('git',['status','--porcelain=v1','--untracked-files=all'],{cwd:root})).stdout.trim();
  if(status)throw new Error('release bundle requires a clean committed source tree');
  return (await exec('git',['rev-parse','HEAD'],{cwd:root})).stdout.trim();
}

function requirePacked(paths,path){
  if(!paths.has(path))throw new Error(`release archive missing required path: ${path}`);
}

const sourceCommit=await cleanHead();
const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
const installed=JSON.parse(await readFile(join(root,'template/tooling/governance/version.json'),'utf8'));
const changelog=await readFile(join(root,'CHANGELOG.md'),'utf8');

if(pkg.private!==true)throw new Error('Distribution 0.2 must remain private from npm publication');
if(pkg.version!==installed.distribution_version)throw new Error('package version and installed distribution version differ');
if(!changelog.includes(`## ${pkg.version}\n`))throw new Error(`CHANGELOG missing Distribution ${pkg.version}`);

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});

await exec(process.execPath,['tooling/release-manifest.mjs','--release'],{cwd:root});

const {stdout}=await exec('npm',[
  'pack',
  '--ignore-scripts',
  '--json',
  '--pack-destination',
  out
],{cwd:root,maxBuffer:8*1024*1024});

const packed=JSON.parse(stdout.trim());
if(!Array.isArray(packed) || packed.length!==1)throw new Error('npm pack returned unexpected result');
const info=packed[0];
const archive=basename(info.filename);
const archivePath=join(out,archive);
const packedFiles=new Set((info.files||[]).map(x=>x.path));

for(const path of [
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'adoption/GREENFIELD.md',
  'adoption/BROWNFIELD.md',
  'adoption/UPGRADE.md',
  'adoption/OPERATIONS.md',
  'core/SPEC.md',
  'core/schemas/decision-v1.md',
  'core/schemas/constraint-v1.md',
  'core/schemas/open-question-v1.md',
  'core/schemas/task-v1.md',
  'core/schemas/state-v1.md',
  'release/RELEASE.md',
  `release/RELEASE-NOTES-${pkg.version}.md`,
  'template/AGENTS.md',
  'template/governance/manifest.yaml',
  'template/tooling/governance/check.mjs',
  'template/tooling/governance/version.json',
  'tooling/init/init.mjs'
])requirePacked(packedFiles,path);

for(const path of packedFiles){
  if(
    path.startsWith('tests/') ||
    path.startsWith('examples/') ||
    path.startsWith('.github/') ||
    path.startsWith('release/CANDIDATE-') ||
    path.startsWith('release/SESSION-')
  )throw new Error(`development-only path leaked into release archive: ${path}`);
}

const manifestPath=join(out,'distribution-manifest.json');
const internalSumsPath=join(out,'SHA256SUMS');
const metadata={
  schema:'governance-release-bundle/v1',
  source_commit:sourceCommit,
  distribution_version:pkg.version,
  governance_version:installed.governance_version,
  checker_version:installed.checker_version,
  archive,
  archive_sha256:await sha256(archivePath),
  npm_shasum:info.shasum,
  npm_integrity:info.integrity,
  packed_file_count:packedFiles.size,
  packed_files:[...packedFiles].sort((a,b)=>a.localeCompare(b,'en')),
  distribution_manifest_sha256:await sha256(manifestPath),
  internal_sha256s_sha256:await sha256(internalSumsPath)
};
const metadataPath=join(out,'release-metadata.json');
await writeFile(metadataPath,JSON.stringify(metadata,null,2)+'\n');

const releaseSums=[
  [await sha256(archivePath),archive],
  [await sha256(manifestPath),'distribution-manifest.json'],
  [await sha256(internalSumsPath),'SHA256SUMS'],
  [await sha256(metadataPath),'release-metadata.json']
].map(([hash,path])=>`${hash}  ${path}`).join('\n')+'\n';
await writeFile(join(out,'RELEASE-SHA256SUMS'),releaseSums);

if(sourceCommit!==await cleanHead())throw new Error('source commit changed while building release bundle');

process.stdout.write(
  `Built Distribution ${pkg.version} release bundle from ${sourceCommit}: ${archive} (${packedFiles.size} packed files).\n`
);
