import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { build } from 'esbuild';

const root=resolve(import.meta.dirname,'..');
for (const name of ['SPEC.md',...['decision','constraint','open-question','task','state'].map(x=>`schemas/${x}-v1.md`)]) {
  const target=resolve(root,'template/governance',name);
  await mkdir(dirname(target),{recursive:true});
  await copyFile(resolve(root,'core',name),target);
}
await build({absWorkingDir:root,entryPoints:['./tooling/check/check.mjs'],outfile:'template/tooling/governance/check.mjs',bundle:true,platform:'node',format:'esm',target:'node20',legalComments:'inline',banner:{js:'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);\n// Repository Governance checker 0.1.0; bundled for offline use.'}});
const source=await readFile(resolve(root,'template/tooling/governance/check.mjs'),'utf8');
if (source.includes('from "yaml"') || source.includes("from 'yaml'")) throw new Error('checker is not bundled');
process.stdout.write('Built exact Core copies and self-contained checker.\n');
