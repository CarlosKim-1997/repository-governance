import { readdir, readFile, lstat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';

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
function presence(targets) {
  const known=['AGENTS.md','governance/manifest.yaml','governance/SPEC.md','tooling/governance/check.mjs'];
  const count=known.filter(x=>targets.get(x)).length;
  if(count===0)return 'NO_GOVERNANCE';
  if(count===known.length)return 'GOVERNANCE_INSTALLED';
  return 'PARTIAL_GOVERNANCE';
}
export async function planInit(target, mode) {
  if(!['greenfield','brownfield'].includes(mode))throw new Error('explicit --greenfield or --brownfield required');
  const root=resolve(target), listing=await files(upstream), existing=new Map(), entries=[];
  for(const rel of listing) {
    const destination=resolve(root,rel), pathRelative=relative(root,destination);
    if(pathRelative.startsWith('..'+sep)||pathRelative==='..')throw new Error('target path escapes repository');
    const s=await present(destination); existing.set(rel,!!s);
    let action='CREATE';
    if(await linkedParent(root,rel))action='MERGE_REQUIRED';
    else if(s) {
      if(!s.isFile()) action='MERGE_REQUIRED';
      else action=(await readFile(destination)).equals(await readFile(resolve(upstream,rel)))?'EXISTS_IDENTICAL':rel==='AGENTS.md'?'MERGE_REQUIRED':'EXISTS_DIFFERENT';
    }
    entries.push({path:rel,action});
  }
  const markers=['governance','canon','work','tooling/governance'];
  const found=await Promise.all(markers.map(x=>present(resolve(root,x))));
  let state=presence(existing);
  if(state==='NO_GOVERNANCE' && found.some(Boolean))state='GOVERNANCE_UNKNOWN';
  const git=await gitInfo(root,entries);
  return {mode,target:root,presence:state,git,entries,blocked:entries.some(x=>['EXISTS_DIFFERENT','MERGE_REQUIRED'].includes(x.action))||['DIRTY_CONFLICTING','DIRTY_AMBIGUOUS'].includes(git.dirty)};
}
export async function applyInit(target,mode) {
  const plan=await planInit(target,mode); // fresh preflight on every apply
  if(plan.blocked) return { ...plan,result:'CONFLICTED' };
  const created=[];
  try {
    for(const entry of plan.entries) if(entry.action==='CREATE') {
      if(await linkedParent(plan.target,entry.path))throw new Error(`linked parent appeared: ${entry.path}`);
      const dest=resolve(plan.target,entry.path);
      await mkdir(dirname(dest),{recursive:true});
      // Exclusive creation protects an intervening user file.
      await writeFile(dest,await readFile(resolve(upstream,entry.path)),{flag:'wx'});
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
