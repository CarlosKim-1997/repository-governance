import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { resolve, relative, sep, posix } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import YAML from 'yaml';

const definitions = {
  'decision/v1': { roots: ['canon/decisions'], statuses: ['PROPOSED','APPROVED','ACTIVE','SUPERSEDED','REJECTED','DEFERRED'], headings: ['Decision','Context','Rationale','Consequences'], relations: ['depends_on','blocked_by','supersedes','implements','related_to'] },
  'constraint/v1': { roots: ['governance/constraints','canon/constraints'], statuses: ['ACTIVE','SUPERSEDED','RETIRED'], headings: ['Constraint','Rationale','Operational Effect'], relations: ['depends_on','supersedes','implements','related_to'] },
  'open-question/v1': { roots: ['canon/open-questions'], statuses: ['OPEN','BLOCKING','RESOLVED','DROPPED'], headings: ['Question','Why It Matters'], relations: ['depends_on','related_to','resolved_by'] },
  'task/v1': { roots: ['work/tasks'], statuses: ['NOT_READY','READY','IN_PROGRESS','BLOCKED','VERIFYING','COMPLETE','CANCELLED'], headings: ['Objective','Scope','Authority','Constraints','Verification','Stop Conditions','Completion Criteria'], relations: ['depends_on','blocked_by','implements','related_to'] },
  'state/v1': { roots: ['canon/state'], statuses: ['NOT_READY','READY','IN_PROGRESS','BLOCKED','VERIFYING','COMPLETE','CANCELLED'], headings: ['Current Position','Active Work','Blockers','Material Risks','Verification Basis'], relations: [] }
};
const relationKeys = ['depends_on','blocked_by','supersedes','implements','related_to','resolved_by'];
const reverseKeys = ['blocks','superseded_by','implemented_by','depended_on_by','replaced_by'];
const manifestKeys = ['schema','governance_version','areas','current_state','supported_schemas'];
const commonKeys = ['schema','id','status','areas',...relationKeys];
const idRegex = /^(D|INV|C|OQ|T)-[0-9]+$/;
const areaRegex = /^[a-z][a-z0-9-]*$/;
const has = (o,k) => Object.hasOwn(o,k);
const arraysEqual = (a,b) => a.length === b.length && a.every((v,i) => v === b[i]);

function parseYaml(source, path, add) {
  const doc = YAML.parseDocument(source, { uniqueKeys: true, strict: true });
  for (const error of doc.errors) add('ERROR','GOV-SCHEMA-YAML',path,`invalid YAML: ${error.message}`);
  if (doc.errors.length) return null;
  let value;
  try { value = doc.toJS(); }
  catch(error) { add('ERROR','GOV-SCHEMA-YAML',path,`invalid YAML: ${error.message}`); return null; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) { add('ERROR','GOV-SCHEMA-YAML',path,'expected YAML mapping'); return null; }
  return value;
}
function parseRecord(source, path, add) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source);
  if (!match) { add('ERROR','GOV-SCHEMA-FRONTMATTER',path,'missing YAML frontmatter'); return null; }
  const data = parseYaml(match[1],path,add);
  return data ? { data, body: match[2] } : null;
}
function uniqueList(value) { return Array.isArray(value) && value.length > 0 && value.every(x => typeof x === 'string' && x.length > 0) && new Set(value).size === value.length; }
function type(item) { return item.data.schema === 'constraint/v1' ? item.data.id?.startsWith('INV-') ? 'INV' : 'C' : item.data.schema === 'decision/v1' ? 'D' : item.data.schema === 'open-question/v1' ? 'OQ' : item.data.schema === 'task/v1' ? 'T' : 'STATE'; }
function allowedTarget(source, relation, target) {
  const a = type(source), b = type(target);
  if (relation === 'related_to') return ['D','INV','C','OQ','T'].includes(b);
  if (relation === 'resolved_by') return a === 'OQ' && b === 'D';
  if (a === 'D') return ({ depends_on:['D','INV','C'], blocked_by:['OQ','T'], supersedes:['D'], implements:['D'] })[relation]?.includes(b) ?? false;
  if (a === 'OQ') return relation === 'depends_on' && ['D','INV','C','OQ'].includes(b);
  if (a === 'T') return ({ depends_on:['T'], blocked_by:['OQ','T'], implements:['D','INV','C'] })[relation]?.includes(b) ?? false;
  if (a === 'INV' || a === 'C') {
    const governance = source.path.startsWith('governance/');
    if (relation === 'depends_on') return governance ? ['INV','C'].includes(b) && target.path.startsWith('governance/') : ['D','INV','C'].includes(b);
    if (relation === 'implements') return ['INV','C'].includes(b) && (!governance || target.path.startsWith('governance/')) || !governance && b === 'D';
    if (relation === 'supersedes') return governance ? b === a && target.path.startsWith('governance/') : b === 'C' && target.path.startsWith('canon/constraints/');
  }
  return false;
}
function detectCycles(items, edges, rule, add) {
  const byId = new Map(items.filter(x=>x.data.id).map(x=>[x.data.id,x]));
  const visiting = new Set(), visited = new Set(), reported = new Set();
  function visit(id, chain) {
    if (visiting.has(id)) {
      const cycle = [...chain.slice(chain.indexOf(id)),id].join(' -> ');
      if (!reported.has(cycle)) { reported.add(cycle); add('ERROR',rule,byId.get(id)?.path ?? '',`cycle: ${cycle}`,id); }
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of edges.get(id) ?? []) if (byId.has(next)) visit(next,[...chain,id]);
    visiting.delete(id); visited.add(id);
  }
  for (const id of [...edges.keys()].sort()) visit(id,[]);
}

export async function checkGovernance(base = process.cwd()) {
  const root = resolve(base);
  const findings = [];
  const add = (severity,rule_id,file,message,record_id, target) => findings.push({severity,rule_id,file,record_id:record_id ?? null,message,target:target ?? null});
  const absolute = p => resolve(root,p);
  const exists = async p => { try { await stat(absolute(p)); return true; } catch(e) { if(e.code==='ENOENT') return false; throw e; } };
  const required = ['AGENTS.md','governance/README.md','governance/manifest.yaml','governance/SPEC.md','canon/principles/PROJECT.md',...Object.keys(definitions).map(s=>`governance/schemas/${s.replace('/','-')}.md`),'tooling/governance/check.mjs','tooling/governance/version.json'];
  for (const p of required) if (!await exists(p)) add('ERROR','GOV-BOOT-MISSING',p,'missing bootstrap file');
  let manifest = null;
  if (await exists('governance/manifest.yaml')) manifest = parseYaml(await readFile(absolute('governance/manifest.yaml'),'utf8'),'governance/manifest.yaml',add);
  if (manifest) {
    for (const key of manifestKeys) if (!has(manifest,key)) add('ERROR','GOV-MANIFEST-REQUIRED','governance/manifest.yaml',`missing ${key}`);
    for (const key of Object.keys(manifest)) if (!manifestKeys.includes(key)) add('ERROR','GOV-MANIFEST-UNKNOWN','governance/manifest.yaml',`unknown field ${key}`);
    if (manifest.schema !== 'governance-manifest/v1' || manifest.governance_version !== '1.0.0') add('ERROR','GOV-MANIFEST-VERSION','governance/manifest.yaml','unsupported schema or governance version');
    if (!uniqueList(manifest.areas) || !manifest.areas.includes('global') || manifest.areas.some(x=>!areaRegex.test(x))) add('ERROR','GOV-MANIFEST-AREAS','governance/manifest.yaml','areas must be unique valid names including global');
    if (!uniqueList(manifest.supported_schemas) || !arraysEqual([...manifest.supported_schemas].sort(),Object.keys(definitions).sort())) add('ERROR','GOV-MANIFEST-SCHEMAS','governance/manifest.yaml','supported_schemas must contain exactly the five v1 schemas');
    const p = manifest.current_state;
    if (typeof p !== 'string' || !/^canon\/state\/[A-Za-z0-9._-]+\.md$/.test(p) || p.includes('..') || !relative(root,absolute(p)) || relative(root,absolute(p)).startsWith('..'+sep)) add('ERROR','GOV-MANIFEST-STATE','governance/manifest.yaml','current_state must be a repository-local Markdown file in canon/state');
    else if (await exists(p)) {
      const realRoot=await realpath(root), realState=await realpath(absolute(p));
      if (realState !== realRoot && !realState.startsWith(realRoot+sep)) add('ERROR','GOV-MANIFEST-STATE','governance/manifest.yaml','current_state escapes repository');
    }
  }
  const discovered=[];
  for (const def of Object.values(definitions)) for (const folder of def.roots) {
    let entries=[]; try { entries=await readdir(absolute(folder),{withFileTypes:true}); } catch(e) { if(e.code!=='ENOENT') throw e; }
    for (const e of entries) if (e.name.endsWith('.md') && (e.isFile() || e.isSymbolicLink())) discovered.push(`${folder}/${e.name}`);
  }
  discovered.sort();
  const items=[], ids=new Map();
  for (const path of discovered) {
    const realRoot=await realpath(root), realFile=await realpath(absolute(path));
    if (!realFile.startsWith(realRoot+sep)) { add('ERROR','GOV-SCHEMA-PATH',path,'record escapes repository'); continue; }
    const parsed=parseRecord(await readFile(absolute(path),'utf8'),path,add);
    if (!parsed) continue;
    const {data,body}=parsed, def=definitions[data.schema];
    if (!def) { add('ERROR','GOV-SCHEMA-UNSUPPORTED',path,'unsupported schema',data.id); continue; }
    if (!def.roots.some(folder=>path.startsWith(folder+'/'))) add('ERROR','GOV-SCHEMA-LOCATION',path,'wrong authoritative collection',data.id);
    if (data.schema==='state/v1' && path!==manifest?.current_state) add('ERROR','GOV-STATE-SECOND',path,'second or unselected State record');
    const allowed=new Set([...commonKeys,...(data.schema==='constraint/v1'?['kind','overridable']:[])]);
    for (const key of Object.keys(data)) if (!allowed.has(key)) add(reverseKeys.includes(key)?'ERROR':'WARN',reverseKeys.includes(key)?'GOV-REL-REVERSE':'GOV-SCHEMA-UNKNOWN',path,`unknown ${reverseKeys.includes(key)?'reverse relation':'metadata'} ${key}`,data.id);
    for (const key of ['schema','status','areas',...(data.schema==='state/v1'?[]:['id']),...(data.schema==='constraint/v1'?['kind']:[])]) if (!has(data,key)) add('ERROR','GOV-SCHEMA-REQUIRED',path,`missing ${key}`,data.id);
    if (!def.statuses.includes(data.status)) add('ERROR','GOV-LIFE-STATUS',path,`invalid status ${data.status}`,data.id);
    if (!uniqueList(data.areas) || data.areas.some(x=>!areaRegex.test(x)||!Array.isArray(manifest?.areas)||!manifest.areas.includes(x)) || data.areas.includes('global') && data.areas.length>1) add('ERROR','GOV-AREA-INVALID',path,'invalid, duplicate, unknown, or mixed global area',data.id);
    const expectedPrefix=data.schema==='decision/v1'?'D':data.schema==='open-question/v1'?'OQ':data.schema==='task/v1'?'T':null;
    if (data.schema==='state/v1') { if (has(data,'id')) add('ERROR','GOV-ID-STATE',path,'State has no ID'); }
    else {
      if (typeof data.id!=='string' || !idRegex.test(data.id) || expectedPrefix && !data.id.startsWith(expectedPrefix+'-')) add('ERROR','GOV-ID-FORMAT',path,'invalid ID',data.id);
      else if (ids.has(data.id)) add('ERROR','GOV-ID-DUPLICATE',path,`duplicate ID, first at ${ids.get(data.id)}`,data.id);
      else ids.set(data.id,path);
    }
    if (data.schema==='constraint/v1') {
      if (!['INVARIANT','HARD_CONSTRAINT'].includes(data.kind) || data.id?.startsWith('INV-') && data.kind!=='INVARIANT' || data.id?.startsWith('C-') && data.kind!=='HARD_CONSTRAINT' || !/^(INV|C)-[0-9]+$/.test(data.id??'')) add('ERROR','GOV-SCHEMA-KIND',path,'constraint ID/kind mismatch',data.id);
      if (path.startsWith('canon/') && data.kind!=='HARD_CONSTRAINT') add('ERROR','GOV-SCHEMA-PROJECT-INV',path,'Project Invariant forbidden',data.id);
      if (has(data,'overridable') && typeof data.overridable!=='boolean' || data.kind==='INVARIANT' && data.overridable===true) add('ERROR','GOV-SCHEMA-OVERRIDABLE',path,'invalid overridable value',data.id);
    }
    if (!/^# .+$/m.test(body)) add('ERROR','GOV-SCHEMA-TITLE',path,'missing title',data.id);
    for (const heading of def.headings) if (!body.split(/\r?\n/).includes(`## ${heading}`)) add('ERROR','GOV-SCHEMA-HEADING',path,`missing heading ${heading}`,data.id);
    for (const key of relationKeys) if (has(data,key)) {
      if (!def.relations.includes(key)) add('ERROR','GOV-REL-FORBIDDEN',path,`forbidden relation ${key}`,data.id);
      if (key==='resolved_by') { if (typeof data[key]!=='string' || !/^D-[0-9]+$/.test(data[key])) add('ERROR','GOV-REL-RESOLUTION',path,'resolved_by must be one Decision ID',data.id,data[key]); }
      else if (!uniqueList(data[key]) || data[key].some(x=>!idRegex.test(x))) add('ERROR','GOV-REL-FORMAT',path,`invalid or duplicate ${key} targets`,data.id);
      if (data.id && (Array.isArray(data[key])?data[key].includes(data.id):data[key]===data.id)) add('ERROR','GOV-REL-SELF',path,`self-reference in ${key}`,data.id);
    }
    if (data.schema==='open-question/v1') {
      if (data.status==='RESOLVED' && !has(data,'resolved_by')) add('ERROR','GOV-LIFE-RESOLUTION',path,'RESOLVED requires resolved_by',data.id);
      if (['OPEN','BLOCKING'].includes(data.status) && has(data,'resolved_by')) add('ERROR','GOV-LIFE-RESOLUTION',path,'OPEN/BLOCKING forbids resolved_by',data.id);
    }
    items.push({path,data});
  }
  const states=items.filter(x=>x.data.schema==='state/v1');
  if (states.length!==1 || !states.some(x=>x.path===manifest?.current_state)) add('ERROR','GOV-STATE-COUNT','canon/state','exactly one selected State is required');
  const byId=new Map(items.filter(x=>typeof x.data.id==='string' && idRegex.test(x.data.id)).map(x=>[x.data.id,x]));
  for (const item of items) for (const key of relationKeys) {
    const refs=key==='resolved_by' ? typeof item.data[key]==='string'?[item.data[key]]:[] : Array.isArray(item.data[key])?item.data[key]:[];
    for (const ref of refs) {
      const target=byId.get(ref);
      if (!target) add('ERROR','GOV-REL-MISSING',item.path,`unresolved ${key} target ${ref}`,item.data.id,ref);
      else if (!allowedTarget(item,key,target)) add('ERROR','GOV-REL-TARGET',item.path,`forbidden ${key} target ${ref}`,item.data.id,ref);
    }
  }
  for (const [key,rule] of [['depends_on','GOV-GRAPH-DEPENDS'],['supersedes','GOV-GRAPH-SUPERSEDES'],['implements','GOV-GRAPH-IMPLEMENTS']]) {
    const edges=new Map(items.filter(x=>x.data.id).map(x=>[x.data.id,Array.isArray(x.data[key])?x.data[key]:[]]));
    detectCycles(items,edges,rule,add);
  }
  const taskEdges=new Map(items.filter(x=>x.data.schema==='task/v1').map(x=>[x.data.id,[...(x.data.depends_on??[]),...(x.data.blocked_by??[]).filter(y=>y.startsWith('T-'))]]));
  detectCycles(items,taskEdges,'GOV-GRAPH-TASK',add);
  findings.sort((a,b)=>[a.file,a.rule_id,a.record_id??'',a.target??'',a.message].join('\0').localeCompare([b.file,b.rule_id,b.record_id??'',b.target??'',b.message].join('\0'),'en'));
  return { level:findings.some(x=>x.severity==='ERROR')?'ERROR':findings.some(x=>x.severity==='WARN')?'WARN':'PASS', findings };
}

if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result=await checkGovernance(process.argv[2]??process.cwd());
    for (const f of result.findings) process.stdout.write(`${f.severity} ${f.rule_id} ${f.file}${f.record_id?' '+f.record_id:''}${f.target?' -> '+f.target:''}: ${f.message}\n`);
    process.stdout.write(`${result.level}: governance structure\n`);
    process.exitCode=result.level==='ERROR'?1:0;
  } catch(error) { process.stderr.write(`TOOL FAILURE: ${error.stack??error}\n`); process.exitCode=2; }
}
