/**
 * Independent regression tests for the reviewed Optional Verification helper.
 * Run from the repository root:
 *   node --test --test-reporter=tap /path/to/review_regression.test.mjs
 * Or set GOV_VERIFY_MODULE to the helper path. No third-party dependencies.
 * The reviewed snapshot is expected to FAIL five tests; these are regressions to fix.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const helper=resolve(process.env.GOV_VERIFY_MODULE || 'tooling/verify/verify.mjs');
const {inspectPlan,runPlan,checkEvidence}=await import(pathToFileURL(helper).href);
async function fixture(fn){
 const root=await mkdtemp(join(tmpdir(),'gov-review-'));
 try{
  await mkdir(join(root,'src'));await mkdir(join(root,'tests'));
  await writeFile(join(root,'src/value.txt'),'42');
  const plan={format:'verification-plan/local-v1',requirement:{source:'Task Verification: R1',scope:'bounded probe'},targets:['src','tests'],artifactDir:'.evidence',checks:[{label:'R1',kind:'command',inputs:'6*7',expected:'observed: 42',basis:'direct arithmetic',failure:'wrong output or incomplete execution record',permissions:'local temp fixture only',command:{executable:'node',args:['-e','console.log("observed: 42")'],cwd:'.'},timeoutMs:2000,maxOutputBytes:32768,assertions:{exitCode:0,stdoutIncludes:['observed: 42']}}]};
  const run=async()=>{await writeFile(join(root,'plan.json'),JSON.stringify(plan));return runPlan(root,'plan.json',{approval:(await inspectPlan(root,'plan.json')).planHash});};
  await fn({root,plan,run});
 }finally{await rm(root,{recursive:true,force:true});}
}
test('control: a genuine named test can satisfy the mechanical gate',()=>fixture(async({root,plan,run})=>{
 await writeFile(join(root,'tests/genuine.mjs'),'import {test} from "node:test";import assert from "node:assert/strict";test("calculation",()=>assert.equal(6*7,42));');
 plan.checks[0].command.args=['--test','--test-reporter=tap','tests/genuine.mjs'];plan.checks[0].assertions={exitCode:0,testSummary:'node-tap'};
 const r=await run();assert.equal(r.status,'SATISFIED');assert.equal(r.semanticAcceptance,'UNVERIFIED');
}));
for(const name of ['empty.mjs','empty','empty.test','empty.jsx']){
 test(`empty test file is not evidence of executed cases: ${name}`,()=>fixture(async({root,plan,run})=>{
  await writeFile(join(root,'tests',name),'');
  plan.checks[0].command.args=['--test','--test-reporter=tap','tests/'+name];plan.checks[0].assertions={exitCode:0,testSummary:'node-tap'};
  const r=await run();assert.notEqual(r.status,'SATISFIED','A file-level Node runner pass is not a named test-case pass.');
 }));
}
test('an incomplete execution record must not remain current and satisfied',()=>fixture(async({root,run})=>{
 const r=await run();
 delete r.startedAt;delete r.environment;
 for(const key of ['executable','cwd','startedAt','endedAt','observationMissing','signal','cleanup'])delete r.checks[0][key];
 for(const name of ['stdout','stderr']){delete r.checks[0][name].bytes;delete r.checks[0][name].truncated;}
 await writeFile(join(root,r.resultPath),JSON.stringify(r));
 const checked=await checkEvidence(root,'plan.json',r.resultPath);
 assert.ok(!(checked.current && checked.status==='SATISFIED'),'Execution identity/completeness metadata is absent.');
}));
test('a recorded invocation contradicting the approved plan must be rejected',()=>fixture(async({root,run})=>{
 const r=await run();r.checks[0].executable='/different/tool';r.checks[0].cwd='/different/workspace';
 await writeFile(join(root,r.resultPath),JSON.stringify(r));
 const checked=await checkEvidence(root,'plan.json',r.resultPath);
 assert.ok(!(checked.current && checked.status==='SATISFIED'),'Recorded cwd/executable contradict the plan.');
}));
test('control: omission of the exit code is already rejected',()=>fixture(async({root,run})=>{
 const r=await run();delete r.checks[0].exitCode;await writeFile(join(root,r.resultPath),JSON.stringify(r));
 assert.equal((await checkEvidence(root,'plan.json',r.resultPath)).current,false);
}));
