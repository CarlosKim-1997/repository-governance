import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import process from 'node:process';

const root=resolve(import.meta.dirname,'..');
const out=join(root,'dist','release');
const exec=promisify(execFile);

async function sha256(path){
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

async function cleanHead(){
  const status=(await exec('git',['status','--porcelain=v1','--untracked-files=all'],{cwd:root})).stdout.trim();
  if(status)throw new Error('release verification requires a clean committed source tree');
  return (await exec('git',['rev-parse','HEAD'],{cwd:root})).stdout.trim();
}

function parseSums(text){
  const result=new Map();
  for(const line of text.trim().split(/\r?\n/)){
    const match=line.match(/^([0-9a-f]{64})  (.+)$/);
    if(!match)throw new Error(`invalid checksum line: ${line}`);
    result.set(match[2],match[1]);
  }
  return result;
}

const head=await cleanHead();
const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
const installed=JSON.parse(await readFile(join(root,'template/tooling/governance/version.json'),'utf8'));
const metadata=JSON.parse(await readFile(join(out,'release-metadata.json'),'utf8'));
const manifest=JSON.parse(await readFile(join(out,'distribution-manifest.json'),'utf8'));

if(metadata.schema!=='governance-release-bundle/v1')throw new Error('unexpected release metadata schema');
if(manifest.schema!=='governance-distribution-manifest/v1')throw new Error('unexpected distribution manifest schema');
if(metadata.source_commit!==head || manifest.source_commit!==head)throw new Error('release output is not bound to current HEAD');
if(metadata.distribution_version!==pkg.version || manifest.distribution_version!==pkg.version)throw new Error('distribution version mismatch');
if(metadata.distribution_version!==installed.distribution_version)throw new Error('installed version metadata mismatch');
if(metadata.governance_version!==installed.governance_version || manifest.governance_version!==installed.governance_version)throw new Error('Governance version mismatch');
if(metadata.checker_version!==installed.checker_version || manifest.checker_version!==installed.checker_version)throw new Error('checker version mismatch');

const archivePath=join(out,metadata.archive);
if(await sha256(archivePath)!==metadata.archive_sha256)throw new Error('release archive SHA-256 mismatch');
if(await sha256(join(out,'distribution-manifest.json'))!==metadata.distribution_manifest_sha256)throw new Error('distribution manifest SHA-256 mismatch');
if(await sha256(join(out,'SHA256SUMS'))!==metadata.internal_sha256s_sha256)throw new Error('internal checksum file SHA-256 mismatch');

const releaseSums=parseSums(await readFile(join(out,'RELEASE-SHA256SUMS'),'utf8'));
for(const name of [metadata.archive,'distribution-manifest.json','SHA256SUMS','release-metadata.json']){
  const expected=releaseSums.get(name);
  if(!expected)throw new Error(`RELEASE-SHA256SUMS missing ${name}`);
  if(await sha256(join(out,name))!==expected)throw new Error(`release checksum mismatch: ${name}`);
}

for(const artifact of manifest.artifacts){
  const actual=await sha256(join(root,artifact.path));
  if(actual!==artifact.sha256)throw new Error(`source artifact drift: ${artifact.path}`);
}

const {stdout}=await exec('npm',['pack','--ignore-scripts','--dry-run','--json'],{
  cwd:root,
  maxBuffer:8*1024*1024
});
const dry=JSON.parse(stdout.trim());
if(!Array.isArray(dry) || dry.length!==1)throw new Error('npm pack dry-run returned unexpected result');
const expected=[...(dry[0].files||[]).map(x=>x.path)].sort((a,b)=>a.localeCompare(b,'en'));
const recorded=[...metadata.packed_files].sort((a,b)=>a.localeCompare(b,'en'));
if(JSON.stringify(expected)!==JSON.stringify(recorded))throw new Error('packed file set no longer matches release metadata');
if(recorded.length!==metadata.packed_file_count)throw new Error('packed file count mismatch');

process.stdout.write(
  `Verified Distribution ${metadata.distribution_version} release bundle at ${head}: ${metadata.archive}.\n`
);
