import { readdir, readFile, lstat, stat, realpath, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';
import YAML from 'yaml';

const exec=promisify(execFile);
const upstream=resolve(dirname(fileURLToPath(import.meta.url)),'../../template');
const present=async p=>{try{return await lstat(p)}catch(e){if(e.code==='ENOENT')return null;throw e}};
async function files(dir, prefix='') {
  const out=[];
  for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'))) {
    const rel=prefix?`${prefix}/${entry.name}`:entry.name;
    if(entry.isDirectory())out.push(...await files(join(dir,entry.name),rel));
    else if(entry.isFile())out.push(rel);
  }
  return out;
}
async function linkedParent(root, rel) {
  let path=root;
  for(const part of rel.split('/').slice(0,-1)) {
    path=join(path,part);
    const found=await present(path);
    if(found?.isSymbolicLink())return true;
  }
  return false;
}
async function gitInfo(target, entries) {
  let inside=false, branch=null, head=null, dirty='NO_GIT', worktrees=[];
  let probe=target;
  while(!await present(probe) && dirname(probe)!==probe) probe=dirname(probe);
  try {
    const run=async args=>(await exec('git',args,{cwd:probe})).stdout.trim();
    inside=(await run(['rev-parse','--is-inside-work-tree']))==='true';
    if(!inside)return {inside,branch,head,dirty,worktrees};
    branch=await run(['branch','--show-current']);
    head=await run(['rev-parse','HEAD']).catch(()=>null);
    const status=await run(['status','--porcelain=v1','--untracked-files=all']);
    worktrees=(await run(['worktree','list','--porcelain'])).split(/\r?\n/).filter(x=>x.startsWith('worktree ')).map(x=>x.slice(9));
    const changed=status.split(/\r?\n/).filter(Boolean).map(x=>x.slice(3).replaceAll('\\','/'));
    const conflict=new Set(entries.filter(x=>['EXISTS_DIFFERENT','MERGE_REQUIRED'].includes(x.action)).map(x=>relative(probe,resolve(target,x.path)).replaceAll('\\','/')));
    dirty=changed.length===0?'CLEAN':changed.some(x=>conflict.has(x))?'DIRTY_CONFLICTING':'DIRTY_NON_CONFLICTING';
  } catch { if(inside) dirty='DIRTY_AMBIGUOUS'; }
  return {inside,branch,head,dirty,worktrees};
}
const installedLandmarks=[
  'AGENTS.md','governance/README.md','governance/manifest.yaml','governance/SPEC.md',
  ...['decision','constraint','open-question','task','state'].map(x=>`governance/schemas/${x}-v1.md`),
  'canon/principles/PROJECT.md','tooling/governance/check.mjs','tooling/governance/version.json'
];
async function installedPresence(root) {
  const specific=['governance/manifest.yaml','governance/SPEC.md','tooling/governance/check.mjs','tooling/governance/version.json'];
  if(!(await Promise.all(specific.map(x=>present(resolve(root,x))))).some(Boolean)) {
    const governance=!!await present(resolve(root,'governance'));
    const tooling=!!await present(resolve(root,'tooling/governance'));
    const state=!!await present(resolve(root,'canon/state/current.md'));
    return governance && (tooling || state)?'GOVERNANCE_UNKNOWN':'NO_GOVERNANCE';
  }
  const realRoot=await realpath(root);
  const localFile=async path=>{
    try {
      const target=resolve(root,path), info=await stat(target), actual=await realpath(target);
      return info.isFile() && (actual===realRoot || actual.startsWith(realRoot+sep));
    } catch(e) { if(e.code==='ENOENT')return false; throw e; }
  };
  if(!(await Promise.all(installedLandmarks.map(localFile))).every(Boolean))return 'PARTIAL_GOVERNANCE';
  try {
    const document=YAML.parseDocument(await readFile(resolve(root,'governance/manifest.yaml'),'utf8'),{uniqueKeys:true,strict:true});
    if(document.errors.length)return 'PARTIAL_GOVERNANCE';
    const manifest=document.toJS();
    const version=JSON.parse(await readFile(resolve(root,'tooling/governance/version.json'),'utf8'));
    if(manifest?.schema!=='governance-manifest/v1' || typeof manifest.governance_version!=='string' || !manifest.governance_version ||
       !Array.isArray(manifest.areas) || !manifest.areas.includes('global') ||
       !Array.isArray(manifest.supported_schemas) || !manifest.supported_schemas.length ||
       version?.governance_version!==manifest.governance_version ||
       typeof manifest.current_state!=='string' || !/^canon\/state\/[A-Za-z0-9._-]+\.md$/.test(manifest.current_state) || manifest.current_state.includes('..') ||
       !await localFile(manifest.current_state))return 'PARTIAL_GOVERNANCE';
  } catch { return 'PARTIAL_GOVERNANCE'; }
  return 'GOVERNANCE_INSTALLED';
}
export async function planInit(target, mode, templateRoot=upstream) {
  if(!['greenfield','brownfield'].includes(mode))throw new Error('explicit --greenfield or --brownfield required');
  const root=resolve(target), listing=await files(templateRoot), state=await installedPresence(root), entries=[];
  for(const rel of listing) {
    const destination=resolve(root,rel), pathRelative=relative(root,destination);
    if(pathRelative.startsWith('..'+sep)||pathRelative==='..')throw new Error('target path escapes repository');
    const s=await present(destination);
    let action='CREATE';
    if(await linkedParent(root,rel))action=state==='GOVERNANCE_INSTALLED'?'EXISTS_DIFFERENT':'MERGE_REQUIRED';
    else if(s) {
      if(!s.isFile()) action=state==='GOVERNANCE_INSTALLED'?'EXISTS_DIFFERENT':'MERGE_REQUIRED';
      else action=(await readFile(destination)).equals(await readFile(resolve(templateRoot,rel)))?'EXISTS_IDENTICAL':state==='GOVERNANCE_INSTALLED'?'EXISTS_DIFFERENT':rel==='AGENTS.md'?'MERGE_REQUIRED':'EXISTS_DIFFERENT';
    }
    else if(state==='GOVERNANCE_INSTALLED')action='UPSTREAM_MISSING_LOCALLY';
    entries.push({path:rel,action});
  }
  const git=await gitInfo(root,state==='GOVERNANCE_INSTALLED'?[]:entries);
  const upstreamOwned=path=>path.startsWith('governance/') && path!=='governance/manifest.yaml' || path.startsWith('tooling/governance/');
  const versionChanged=state==='GOVERNANCE_INSTALLED' && YAML.parse(await readFile(resolve(root,'governance/manifest.yaml'),'utf8')).governance_version!==YAML.parse(await readFile(resolve(templateRoot,'governance/manifest.yaml'),'utf8')).governance_version;
  const upgrade_review_required=state==='GOVERNANCE_INSTALLED' && (versionChanged || entries.some(x=>x.action==='UPSTREAM_MISSING_LOCALLY' || x.action==='EXISTS_DIFFERENT' && upstreamOwned(x.path)));
  const note=state==='GOVERNANCE_INSTALLED'?upgrade_review_required?'Installed snapshot recognized; upstream differences require explicit upgrade review. Init will not modify files.':'Installed snapshot recognized; init will not modify files.':null;
  return {mode,target:root,presence:state,git,entries,upgrade_review_required,note,blocked:state==='GOVERNANCE_INSTALLED'?false:['PARTIAL_GOVERNANCE','GOVERNANCE_UNKNOWN'].includes(state)||entries.some(x=>['EXISTS_DIFFERENT','MERGE_REQUIRED'].includes(x.action))||['DIRTY_CONFLICTING','DIRTY_AMBIGUOUS'].includes(git.dirty)};
}
export async function applyInit(target,mode,templateRoot=upstream) {
  const plan=await planInit(target,mode,templateRoot); // fresh preflight on every apply
  if(plan.presence==='GOVERNANCE_INSTALLED')return {...plan,result:'ALREADY_INSTALLED',created:[]};
  if(['PARTIAL_GOVERNANCE','GOVERNANCE_UNKNOWN'].includes(plan.presence))return {...plan,result:'RECOVERY_REQUIRED'};
  if(plan.blocked) return { ...plan,result:'CONFLICTED' };
  const created=[];
  try {
    for(const entry of plan.entries) if(entry.action==='CREATE') {
      if(await linkedParent(plan.target,entry.path))throw new Error(`linked parent appeared: ${entry.path}`);
      const dest=resolve(plan.target,entry.path);
      await mkdir(dirname(dest),{recursive:true});
      // Exclusive creation protects an intervening user file.
      await writeFile(dest,await readFile(resolve(templateRoot,entry.path)),{flag:'wx'});
      created.push(entry.path);
    }
    for(const folder of ['governance/constraints','canon/decisions','canon/constraints','canon/open-questions','work/tasks','work/reports']) await mkdir(resolve(plan.target,folder),{recursive:true});
  } catch(error) { return { ...plan,result:'PARTIAL_INSTALLATION',created,error:String(error) }; }
  let check;
  try { const {stdout,stderr}=await exec(process.execPath,['tooling/governance/check.mjs'],{cwd:plan.target}); check={exit:0,output:stdout+stderr}; }
  catch(e) { check={exit:e.code??2,output:(e.stdout??'')+(e.stderr??'')}; }
  return {...plan,result:check.exit===0?plan.entries.every(x=>x.action==='EXISTS_IDENTICAL')?'ALREADY_INSTALLED':mode==='brownfield'?'SKELETON INSTALLED — ADOPTION NOT COMPLETE':'INSTALLED_VERIFIED':'INSTALLED_UNVERIFIED',created,check};
}
function parseArgs(argv) {
  if(argv[0]!=='init')throw new Error('usage: governance init (--greenfield | --brownfield) [--target PATH] [--apply]');
  const modes=argv.filter(x=>x==='--greenfield'||x==='--brownfield');
  if(modes.length!==1)throw new Error('exactly one mode required');
  const unknown=argv.filter((x,i)=>!['init','--greenfield','--brownfield','--apply','--target'].includes(x) && argv[i-1]!=='--target');
  if(unknown.length)throw new Error(`unknown argument: ${unknown[0]}`);
  const index=argv.indexOf('--target');
  if(index>=0 && !argv[index+1])throw new Error('--target requires path');
  return {mode:modes[0].slice(2),target:index>=0?argv[index+1]:process.cwd(),apply:argv.includes('--apply')};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const args=parseArgs(process.argv.slice(2));
    const result=args.apply?await applyInit(args.target,args.mode):await planInit(args.target,args.mode);
    process.stdout.write(`${JSON.stringify(result,null,2)}\n`);
    if(result.blocked || ['PARTIAL_INSTALLATION','INSTALLED_UNVERIFIED'].includes(result.result))process.exitCode=1;
  } catch(e) { process.stderr.write(`${e.message}\n`);process.exitCode=2; }
}
