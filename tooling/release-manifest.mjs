import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, join } from 'node:path';
import process from 'node:process';

const root=resolve(import.meta.dirname,'..'), exec=promisify(execFile);
const records=[
  ['core/SPEC.md','NORMATIVE','UPSTREAM_OWNED'],
  ...['decision','constraint','open-question','task','state'].map(x=>[`core/schemas/${x}-v1.md`,'NORMATIVE','UPSTREAM_OWNED']),
  ['template/AGENTS.md','TEMPLATE','MIXED'],
  ['template/governance/manifest.yaml','TEMPLATE','MIXED'],
  ['template/governance/SPEC.md','TEMPLATE','UPSTREAM_OWNED'],
  ...['decision','constraint','open-question','task','state'].map(x=>[`template/governance/schemas/${x}-v1.md`,'TEMPLATE','UPSTREAM_OWNED']),
  ['template/tooling/governance/check.mjs','TOOLING','UPSTREAM_OWNED'],
  ['template/tooling/governance/version.json','TOOLING','UPSTREAM_OWNED'],
  ['tooling/init/init.mjs','TOOLING','UPSTREAM_OWNED'],
  ...['GREENFIELD','BROWNFIELD','FINAL-AUDIT','UPGRADE'].map(x=>[`adoption/${x}.md`,'GUIDANCE','UPSTREAM_OWNED'])
];
let sha='UNCOMMITTED';
try { sha=(await exec('git',['rev-parse','HEAD'],{cwd:root})).stdout.trim(); } catch {}
const artifacts=[];
for(const [path,klass,ownership] of records)artifacts.push({path,class:klass,ownership,sha256:createHash('sha256').update(await readFile(join(root,path))).digest('hex')});
const manifest={schema:'governance-distribution-manifest/v1',distribution_version:'0.1.0',governance_version:'1.0.0',checker_version:'0.1.0',source_commit:sha,artifacts};
await writeFile(join(root,'release/distribution-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(join(root,'release/SHA256SUMS'),artifacts.map(x=>`${x.sha256}  ${x.path}`).join('\n')+'\n');
process.stdout.write(`Wrote ${artifacts.length} artifact hashes; source ${sha}.\n`);
