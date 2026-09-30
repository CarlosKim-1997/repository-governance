import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { inspectWorkspace } from '../../tooling/preflight/preflight.mjs';

const exec=promisify(execFile);

test('workspace preflight reports local Git identity without fetching',async()=>{
  const root=await mkdtemp(join(tmpdir(),'governance-preflight-'));
  const repo=join(root,'repo'),worktree=join(root,'mutation');
  try{
    await mkdir(repo,{recursive:true});
    await exec('git',['init','-b','main'],{cwd:repo});
    await exec('git',['config','user.name','Fixture'],{cwd:repo});
    await exec('git',['config','user.email','fixture@example.invalid'],{cwd:repo});
    await writeFile(join(repo,'README.md'),'baseline\n');
    await exec('git',['add','README.md'],{cwd:repo});
    await exec('git',['commit','-m','baseline'],{cwd:repo});
    const baseline=(await exec('git',['rev-parse','HEAD'],{cwd:repo})).stdout.trim();

    await exec('git',['worktree','add','-b','feature/preflight',worktree,baseline],{cwd:repo});
    await writeFile(join(worktree,'change.txt'),'change\n');
    await exec('git',['add','change.txt'],{cwd:worktree});
    await exec('git',['commit','-m','change'],{cwd:worktree});

    const result=await inspectWorkspace(worktree,'main');
    assert.equal(result.git,true);
    assert.equal(result.branch,'feature/preflight');
    assert.equal(result.clean,true);
    assert.equal(result.network_fetch_performed,false);
    assert.equal(result.worktrees.length,2);
    assert.equal(result.expected.ref,'main');
    assert.equal(result.expected.ahead,1);
    assert.equal(result.expected.behind,0);
    assert.equal(result.expected.matches_head,false);
    assert.match(result.note,/never fetches/);
  } finally {
    await rm(root,{recursive:true,force:true});
  }
});

test('workspace preflight degrades safely outside Git',async()=>{
  const root=await mkdtemp(join(tmpdir(),'governance-preflight-nogit-'));
  try{
    const result=await inspectWorkspace(root);
    assert.equal(result.git,false);
    assert.match(result.note,/can still operate without Git/);
  } finally {
    await rm(root,{recursive:true,force:true});
  }
});
