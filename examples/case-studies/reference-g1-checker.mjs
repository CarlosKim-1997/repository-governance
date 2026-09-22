import { readFile, readdir } from "node:fs/promises";
import { resolve, sep } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import YAML from "yaml";

const schemas = {
  "decision/v1": { root: "canon/decisions", prefix: "D", statuses: ["PROPOSED", "APPROVED", "ACTIVE", "SUPERSEDED", "REJECTED", "DEFERRED"], headings: ["Decision", "Context", "Rationale", "Consequences"], relations: ["depends_on", "blocked_by", "supersedes", "implements", "related_to"] },
  "constraint/v1": { roots: ["governance/constraints", "canon/constraints"], prefix: "C", statuses: ["ACTIVE", "SUPERSEDED", "RETIRED"], headings: ["Constraint", "Rationale", "Operational Effect"], relations: ["depends_on", "blocked_by", "supersedes", "implements", "related_to"] },
  "open-question/v1": { root: "canon/open-questions", prefix: "OQ", statuses: ["OPEN", "BLOCKING", "RESOLVED", "DROPPED"], headings: ["Question", "Why It Matters"], relations: ["depends_on", "blocked_by", "supersedes", "implements", "related_to"] },
  "task/v1": { root: "work/tasks", prefix: "T", statuses: ["NOT_READY", "READY", "IN_PROGRESS", "BLOCKED", "VERIFYING", "COMPLETE", "CANCELLED"], headings: ["Objective", "Scope", "Authority", "Constraints", "Verification", "Stop Conditions", "Completion Criteria"], relations: ["depends_on", "blocked_by", "implements", "related_to"] },
  "state/v1": { statuses: ["NOT_READY", "READY", "IN_PROGRESS", "BLOCKED", "VERIFYING", "COMPLETE", "CANCELLED"], headings: ["Current Position", "Active Work", "Blockers", "Material Risks", "Verification Basis"], relations: [] },
};
const requiredBoot = ["AGENTS.md", "governance/README.md", "governance/manifest.yaml", "governance/SPEC.md", "canon/principles/PROJECT.md", ...Object.keys(schemas).map((name) => `governance/schemas/${name.replace("/", "-")}.md`)];
const roots = ["governance/constraints", "canon/decisions", "canon/constraints", "canon/open-questions", "work/tasks"];
const manifestKeys = ["schema", "governance_version", "areas", "current_state", "supported_schemas"];
const commonKeys = ["schema", "id", "status", "areas", "depends_on", "blocked_by", "supersedes", "implements", "related_to"];
const reverseRelations = ["blocks", "superseded_by", "replaced_by"];
const idPattern = /^(D|C|OQ|T|E)-[0-9]{3,}$/;
const hasOwn = (obj, key) => Object.hasOwn(obj, key);
const inside = (root, path) => path === root || (path.startsWith(root + sep));

async function exists(path) {
  try { await readFile(path); return true; } catch (error) { if (error.code === "ENOENT") return false; throw error; }
}
function parsed(text, label, issue) {
  const document = YAML.parseDocument(text, { uniqueKeys: true, strict: true });
  for (const error of document.errors) issue("ERROR", `${label}: invalid YAML: ${error.message}`);
  if (document.errors.length) return null;
  let value;
  try { value = document.toJS(); } catch (error) { issue("ERROR", `${label}: invalid YAML: ${error.message}`); return null; }
  if (!value || typeof value !== "object" || Array.isArray(value)) { issue("ERROR", `${label}: expected mapping`); return null; }
  return value;
}
function frontmatter(text, label, issue) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  if (!match) { issue("ERROR", `${label}: missing YAML frontmatter`); return null; }
  const data = parsed(match[1], label, issue);
  return data && { data, body: match[2] };
}
function list(value) { return Array.isArray(value) && value.length > 0 && value.every((part) => typeof part === "string" && part.length > 0); }

export async function checkGovernance(base = process.cwd()) {
  const issues = [];
  const issue = (level, message) => issues.push({ level, message });
  const root = resolve(base);
  const file = (name) => resolve(root, name);
  for (const name of requiredBoot) if (!await exists(file(name))) issue("ERROR", `missing bootstrap: ${name}`);
  if (!await exists(file("governance/manifest.yaml"))) return { issues, level: "ERROR" };
  const manifest = parsed(await readFile(file("governance/manifest.yaml"), "utf8"), "manifest", issue);
  if (!manifest) return { issues, level: "ERROR" };
  for (const key of manifestKeys) if (!hasOwn(manifest, key)) issue("ERROR", `manifest: missing ${key}`);
  for (const key of Object.keys(manifest)) if (!manifestKeys.includes(key)) issue("WARN", `manifest: unknown field ${key}`);
  if (manifest.schema !== "governance-manifest/v1") issue("ERROR", "manifest: unsupported schema");
  if (manifest.governance_version !== "1.0.0") issue("ERROR", "manifest: unsupported governance_version");
  if (!list(manifest.areas) || !manifest.areas.includes("global") || new Set(manifest.areas).size !== manifest.areas.length) issue("ERROR", "manifest: areas must be unique and include global");
  if (!list(manifest.supported_schemas) || Object.keys(schemas).some((name) => !manifest.supported_schemas?.includes?.(name)) || (Array.isArray(manifest.supported_schemas) && manifest.supported_schemas.some((name) => !schemas[name]))) issue("ERROR", "manifest: unsupported or missing supported_schemas");
  const statePath = manifest.current_state;
  if (typeof statePath !== "string" || statePath !== "canon/state/current.md" || !inside(root, file(statePath))) issue("ERROR", "manifest: invalid current_state (expected canon/state/current.md)");
  const records = [];
  for (const folder of roots) {
    let names;
    try { names = await readdir(file(folder), { withFileTypes: true }); }
    catch (error) { if (error.code === "ENOENT") continue; throw error; }
    for (const entry of names) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      records.push({ path: `${folder}/${entry.name}`, expected: Object.entries(schemas).find(([, spec]) => [spec.root, ...(spec.roots ?? [])].includes(folder))?.[0] });
    }
  }
  let stateNames = [];
  try { stateNames = await readdir(file("canon/state"), { withFileTypes: true }); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  for (const entry of stateNames) if (entry.isFile() && entry.name.endsWith(".md") && entry.name !== "current.md") records.push({ path: `canon/state/${entry.name}`, expected: "state/v1" });
  if (typeof statePath === "string" && statePath === "canon/state/current.md") records.push({ path: statePath, expected: "state/v1" });
  const ids = new Map();
  const items = [];
  for (const record of records) {
    if (!await exists(file(record.path))) { issue("ERROR", `missing Current State: ${record.path}`); continue; }
    const result = frontmatter(await readFile(file(record.path), "utf8"), record.path, issue);
    if (!result) continue;
    const { data, body } = result;
    const spec = schemas[data.schema];
    if (!spec || !Array.isArray(manifest.supported_schemas) || !manifest.supported_schemas.includes(data.schema)) { issue("ERROR", `${record.path}: unsupported schema`); continue; }
    if (record.expected !== data.schema) issue("ERROR", `${record.path}: invalid authoritative location for ${data.schema}`);
    if (data.schema === "state/v1" && record.path !== statePath) issue("ERROR", `${record.path}: second authoritative Current State record`);
    const extra = data.schema === "constraint/v1" ? ["kind", "overridable"] : data.schema === "open-question/v1" ? ["resolved_by"] : [];
    for (const key of Object.keys(data)) if (![...commonKeys, ...extra].includes(key)) issue(reverseRelations.includes(key) ? "ERROR" : "WARN", `${record.path}: unknown${reverseRelations.includes(key) ? " relationship" : " field"} ${key}`);
    for (const key of ["schema", "status", "areas", ...(spec.prefix ? ["id"] : []), ...(data.schema === "constraint/v1" ? ["kind"] : [])]) if (!hasOwn(data, key)) issue("ERROR", `${record.path}: missing ${key}`);
    if (!spec.statuses.includes(data.status)) issue("ERROR", `${record.path}: invalid status ${data.status}`);
    if (!list(data.areas) || data.areas.some((area) => !manifest.areas?.includes(area))) issue("ERROR", `${record.path}: unknown or invalid area`);
    if (spec.prefix) {
      if (typeof data.id !== "string" || !idPattern.test(data.id) || !data.id.startsWith(`${spec.prefix}-`)) issue("ERROR", `${record.path}: invalid ID`);
      else if (ids.has(data.id)) issue("ERROR", `${record.path}: duplicate ID ${data.id} (also ${ids.get(data.id)})`);
      else ids.set(data.id, record.path);
    } else if (hasOwn(data, "id")) issue("WARN", `${record.path}: singleton State needs no ID`);
    if (!/^# .+$/m.test(body)) issue("ERROR", `${record.path}: missing title heading`);
    if (data.schema === "state/v1" && !/^# Current Project State\s*$/m.test(body)) issue("ERROR", `${record.path}: invalid State title`);
    for (const heading of spec.headings) if (!body.split(/\r?\n/).includes(`## ${heading}`)) issue("ERROR", `${record.path}: missing required heading ${heading}`);
    for (const key of ["depends_on", "blocked_by", "supersedes", "implements", "related_to", "resolved_by"]) {
      if (!hasOwn(data, key)) continue;
      if (!spec.relations.includes(key) && !(data.schema === "open-question/v1" && key === "resolved_by")) issue("ERROR", `${record.path}: disallowed relationship ${key}`);
      if (!list(data[key]) || data[key].some((ref) => !idPattern.test(ref))) issue("ERROR", `${record.path}: invalid ${key} references`);
      if (Array.isArray(data[key]) && data[key].includes(data.id)) issue("ERROR", `${record.path}: self-reference in ${key}`);
    }
    if (data.schema === "constraint/v1") {
      if (!["INVARIANT", "HARD_CONSTRAINT"].includes(data.kind)) issue("ERROR", `${record.path}: invalid constraint kind`);
      if (hasOwn(data, "overridable") && typeof data.overridable !== "boolean") issue("ERROR", `${record.path}: overridable must be boolean`);
      if (data.kind === "INVARIANT" && data.overridable === true) issue("ERROR", `${record.path}: invariant cannot be overridable`);
    }
    if (data.schema === "open-question/v1") {
      if (data.status === "RESOLVED" && (!list(data.resolved_by) || data.resolved_by.some((ref) => !/^(D|E)-[0-9]{3,}$/.test(ref)))) issue("ERROR", `${record.path}: RESOLVED requires Decision/Evidence resolved_by`);
      if (data.status !== "RESOLVED" && hasOwn(data, "resolved_by")) issue("ERROR", `${record.path}: non-RESOLVED question forbids resolved_by`);
    }
    items.push({ ...record, data });
  }
  for (const { path, data } of items) for (const key of ["depends_on", "blocked_by", "supersedes", "implements", "related_to", "resolved_by"]) {
    if (!Array.isArray(data[key])) continue;
    for (const ref of data[key]) if (idPattern.test(ref) && !ids.has(ref)) issue("ERROR", `${path}: unresolved ${key} reference ${ref}`);
  }
  const tasks = new Map(items.filter((item) => item.data.schema === "task/v1").map((item) => [item.data.id, item.data.depends_on ?? []]));
  const visiting = new Set(); const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) { issue("ERROR", `Task dependency cycle at ${id}`); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const ref of tasks.get(id) ?? []) if (tasks.has(ref)) visit(ref);
    visiting.delete(id); visited.add(id);
  }
  for (const id of tasks.keys()) visit(id);
  return { issues, level: issues.some((item) => item.level === "ERROR") ? "ERROR" : issues.some((item) => item.level === "WARN") ? "WARN" : "PASS" };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = await checkGovernance(process.argv[2] ?? process.cwd());
    for (const item of result.issues) process.stdout.write(`${item.level}: ${item.message}\n`);
    process.stdout.write(`${result.level}: governance structure\n`);
    process.exitCode = result.level === "ERROR" ? 1 : 0;
  } catch (error) {
    process.stderr.write(`TOOL FAILURE: ${error.stack ?? error}\n`);
    process.exitCode = 2;
  }
}
