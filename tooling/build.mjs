import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { build } from 'esbuild';

const root=resolve(import.meta.dirname,'..');

for (const name of ['SPEC.md',...['decision','constraint','open-question','task','state'].map(x=>`schemas/${x}-v1.md`)]) {
  const target=resolve(root,'template/governance',name);
  await mkdir(dirname(target),{recursive:true});
  await copyFile(resolve(root,'core',name),target);
}

await copyFile(resolve(root,'adoption/OPERATIONS.md'),resolve(root,'template/governance/OPERATIONS.md'));

const bundles=[
  {
    entry:'./tooling/check/check.mjs',
    outfile:'template/tooling/governance/check.mjs',
    banner:'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);\n// Repository Governance checker 0.1.0; bundled for offline use.'
  },
  {
    entry:'./tooling/preflight/preflight.mjs',
    outfile:'template/tooling/governance/preflight.mjs',
    banner:'// Repository Governance workspace preflight helper 0.2.0; read-only local Git observation.'
  },
  {
    entry:'./tooling/context/context.mjs',
    outfile:'template/tooling/governance/context.mjs',
    banner:'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);\n// Repository Governance context discovery helper 0.2.0; advisory only.'
  }
];

for(const item of bundles){
  await build({
    absWorkingDir:root,
    entryPoints:[item.entry],
    outfile:item.outfile,
    bundle:true,
    platform:'node',
    format:'esm',
    target:'node20',
    legalComments:'inline',
    banner:{js:item.banner}
  });
}

for(const path of ['template/tooling/governance/check.mjs','template/tooling/governance/context.mjs']){
  const source=await readFile(resolve(root,path),'utf8');
  if (source.includes('from "yaml"') || source.includes("from 'yaml'")) throw new Error(`${path} is not bundled`);
}

process.stdout.write('Built exact Core/guidance copies and self-contained Governance tools.\n');
