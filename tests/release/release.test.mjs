import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const root=resolve(import.meta.dirname,'../..');
test('template normative copies exactly match Core',async()=>{
  for(const name of ['SPEC.md',...['decision','constraint','open-question','task','state'].map(x=>`schemas/${x}-v1.md`)])
    assert.deepEqual(await readFile(join(root,'core',name)),await readFile(join(root,'template/governance',name)),name);
});
test('reusable files have no reference-project leakage',async()=>{
  const needles=['ReDiscovery','Judge','Reveal','Conway','Supabase','Next.js','pnpm','CarlosKim-1997'];
  const paths=['core/SPEC.md','template/AGENTS.md','template/governance/README.md','tooling/check/check.mjs','tooling/init/init.mjs'];
  for(const path of paths){const content=await readFile(join(root,path),'utf8');for(const needle of needles)assert.ok(!content.includes(needle),`${path}: ${needle}`)}
});
test('distribution manifest hashes match bytes',async()=>{
  const manifest=JSON.parse(await readFile(join(root,'release/distribution-manifest.json'),'utf8'));
  assert.equal(manifest.schema,'governance-distribution-manifest/v1');
  assert.equal(manifest.artifacts.length,21);
  for(const artifact of manifest.artifacts){
    const actual=createHash('sha256').update(await readFile(join(root,artifact.path))).digest('hex');
    assert.equal(artifact.sha256,actual,artifact.path);
  }
});
