// Preflight: proves that every tool, account, key, and link the build needs
// is in place, before any work starts. Run with:  node scripts/preflight.mjs
//
// It needs no installed packages, prints no secret, and changes nothing.
// Exit code 0 means every check passed.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import net from 'node:net';

const MODEL = 'mistral-small-2603';
const REGION = 'us-east-1';
const PORT = 4321;
const NETLIFY_VARIABLES = {
  // name: the deploy contexts that must have a value
  DATABASE_URL: ['production'],
  PUBLIC_CLERK_PUBLISHABLE_KEY: ['production'],
  CLERK_SECRET_KEY: ['production'],
  ALLOWED_CLERK_USER_IDS: ['production'],
  AI_API_KEY: ['production'],
};

let failures = 0;
const pass = (what) => console.log(`  ok    ${what}`);
const fail = (what, fix) => {
  failures += 1;
  console.log(`  FAIL  ${what}\n        -> ${fix}`);
};
const note = (what) => console.log(`  note  ${what}`);
const skip = (what) => console.log(`  --    skipped: ${what}`);
const section = (name) => console.log(`\n${name}`);

/** Reads NAME=value lines from a file. Returns {} when the file is missing. */
function readEnv(file) {
  if (!existsSync(file)) return null;
  const values = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2').trim();
  }
  return values;
}

/** Runs a command and returns its output, or null when it fails. */
function run(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return null;
  }
}

/** Runs one statement through Neon's HTTP endpoint. */
async function query(connectionString, sql) {
  const host = new URL(connectionString).hostname;
  const response = await fetch(`https://${host}/sql`, {
    method: 'POST',
    headers: { 'Neon-Connection-String': connectionString, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql, params: [] }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()).rows;
}

// ---------------------------------------------------------------- tools
section('Tools');
const pinned = existsSync('.nvmrc') ? readFileSync('.nvmrc', 'utf8').trim().replace(/^v/, '') : '';
const wantedMajor = Number(pinned.split('.')[0]);
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (!wantedMajor) fail('.nvmrc names the Node version', 'The file .nvmrc is missing or empty. Restore it from the repository.');
else if (nodeMajor === wantedMajor) pass(`Node is version ${wantedMajor} (this is ${process.versions.node})`);
else fail(`Node is version ${wantedMajor}`, `This is Node ${process.versions.node}. Install Node ${pinned}. With nvm: nvm install, then nvm use.`);
if (nodeMajor < 18) {
  console.log('\nThe other checks need Node 18 or later. Install the right Node and run the preflight again.');
  process.exit(1);
}

const hasGit = run('git', ['--version']) !== null;
if (hasGit) pass('Git is installed');
else fail('Git is installed', 'Install Git, then run the preflight again.');

const hasGh = run('gh', ['--version']) !== null;
if (hasGh) pass('the GitHub tool (gh) is installed');
else fail('the GitHub tool (gh) is installed', 'Install it from https://cli.github.com, then run: gh auth login');

const netlify = (args) => run('npx', ['--no-install', 'netlify', ...args]) ?? run('netlify', args);
const hasNetlify = netlify(['--version']) !== null;
if (hasNetlify) pass('the Netlify tool is installed');
else fail('the Netlify tool is installed', 'Run: npm install -g netlify-cli   and then: netlify login');

/** True when something accepts a connection on the app's local address. */
const answersOn = (host) =>
  new Promise((resolve) => {
    const socket = net.connect({ host, port: PORT });
    const done = (value) => {
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(1000, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
if (!(await Promise.all(['127.0.0.1', '::1'].map(answersOn))).some(Boolean)) {
  pass(`http://localhost:${PORT} is free`);
} else {
  // Something is listening. This project's own app is fine; another project's is not.
  const pid = run('lsof', ['-nP', `-iTCP:${PORT}`, '-sTCP:LISTEN', '-Fp'])?.match(/^p(\d+)$/m)?.[1];
  const folder = pid ? run('lsof', ['-a', '-p', pid, '-d', 'cwd', '-Fn'])?.match(/^n(.+)$/m)?.[1] : null;
  if (folder && folder === realpathSync(process.cwd())) pass(`http://localhost:${PORT} is in use by this project's own app`);
  else if (folder) fail(`http://localhost:${PORT} is free`, `An app started from ${folder} is using it. Stop that app (in that folder: npm run stop).`);
  else note(`http://localhost:${PORT} is in use, and the preflight could not tell by what. If it is not this project's app, stop it.`);
}

const env = readEnv('.env');
const remote = readEnv('remote.env');

// ---------------------------------------------------------------- files
section('Files');
if (!env) fail('.env exists', 'Create .env in the project folder (see .env.example).');
else pass('.env exists');
if (!remote) fail('remote.env exists', 'Create remote.env in the project folder (see remote.env.example).');
else pass('remote.env exists');

const local = env ?? {};
const hosted = remote ?? {};
for (const name of [
  'DATABASE_URL',
  'PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'ALLOWED_CLERK_USER_IDS',
  'AI_API_KEY',
]) {
  if (local[name]) pass(`.env has ${name}`);
  else fail(`.env has ${name}`, `Add a value for ${name} to .env.`);
}
for (const name of ['PRODUCTION_DATABASE_URL']) {
  if (hosted[name]) pass(`remote.env has ${name}`);
  else fail(`remote.env has ${name}`, `Add a value for ${name} to remote.env.`);
}
for (const file of ['.env', 'remote.env']) {
  if (!hasGit) skip(`${file} is ignored by Git (needs Git, see Tools)`);
  else if (run('git', ['check-ignore', '-q', file]) !== null) pass(`${file} is ignored by Git`);
  else fail(`${file} is ignored by Git`, `Add ${file} to .gitignore before doing anything else.`);
}

// ------------------------------------------------------------ databases
section('Databases');
const databases = {
  dev: local.DATABASE_URL,
  production: hosted.PRODUCTION_DATABASE_URL,
};
const present = Object.entries(databases).filter(([, value]) => value);
if (new Set(present.map(([, value]) => value)).size === present.length && present.length === 2) {
  pass('the two connection strings are different');
} else if (present.length === 2) {
  fail('the two connection strings are different', 'Each Neon branch has its own connection string. These two are the same.');
}
for (const [name, value] of present) {
  try {
    const rows = await query(
      value,
      "select count(*)::int as tables from information_schema.tables where table_schema in ('public', 'drizzle')",
    );
    pass(`${name} answers (${rows[0].tables} tables)`);
  } catch (error) {
    fail(`${name} answers`, `Could not reach the ${name} database (${error.message}). Check its connection string.`);
  }
}

// ---------------------------------------------------------------- Clerk
section('Clerk');
const allowlist = (local.ALLOWED_CLERK_USER_IDS ?? '').split(',').map((id) => id.trim()).filter(Boolean);
if (local.CLERK_SECRET_KEY) {
  if (allowlist.length >= 1) pass(`the local allowlist holds ${allowlist.length} account${allowlist.length === 1 ? '' : 's'}`);
  else fail('the local allowlist holds the owner', "ALLOWED_CLERK_USER_IDS in .env needs the owner's Clerk user ID.");
  for (const [index, id] of allowlist.entries()) {
    const label = `allowlisted account ${index + 1}`;
    try {
      const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${local.CLERK_SECRET_KEY}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) pass(`${label} exists in Clerk`);
      else if (response.status === 401) fail(`${label} exists in Clerk`, 'Clerk rejected CLERK_SECRET_KEY. Copy it again from the Clerk dashboard.');
      else fail(`${label} exists in Clerk`, `Clerk has no such user (HTTP ${response.status}). Check the ID.`);
    } catch (error) {
      fail(`${label} exists in Clerk`, `Could not reach Clerk (${error.message}).`);
    }
  }
}

// -------------------------------------------------------------- Mistral
section('Mistral');
if (local.AI_API_KEY) {
  try {
    const response = await fetch('https://api.mistral.ai/v1/models', {
      headers: { Authorization: `Bearer ${local.AI_API_KEY}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) fail('the key is accepted', `Mistral answered HTTP ${response.status}. Check AI_API_KEY.`);
    else {
      pass('the key is accepted');
      const models = (await response.json()).data?.map((model) => model.id) ?? [];
      if (models.includes(MODEL)) pass(`the model ${MODEL} is available`);
      else fail(`the model ${MODEL} is available`, 'The key cannot use this model. Check the model name in specs/ai.md.');
    }
  } catch (error) {
    fail('the key is accepted', `Could not reach Mistral (${error.message}).`);
  }
}

// --------------------------------------------------------------- GitHub
section('GitHub');
const origin = hasGit ? run('git', ['remote', 'get-url', 'origin'])?.trim() : null;
const repo = origin?.match(/github\.com[:/](.+?)(?:\.git)?$/)?.[1];
if (!hasGh) skip('these checks need the GitHub tool (see Tools)');
else {
  if (run('gh', ['auth', 'status']) !== null) pass('gh is signed in');
  else fail('gh is signed in', 'Run: gh auth login');
  if (repo && run('gh', ['repo', 'view', repo, '--json', 'name']) !== null) pass(`the repository ${repo} is reachable`);
  else fail('the repository is reachable', 'This folder needs a GitHub remote named origin that gh can open.');
}

// -------------------------------------------------------------- Netlify
section('Netlify');
const api = (method, data) => {
  const output = netlify(['api', method, '--data', JSON.stringify(data)]);
  try {
    return output ? JSON.parse(output) : null;
  } catch {
    return null;
  }
};
const siteId = existsSync('.netlify/state.json')
  ? JSON.parse(readFileSync('.netlify/state.json', 'utf8')).siteId
  : null;
if (!hasNetlify) skip('these checks need the Netlify tool (see Tools)');
else if (!siteId) fail('this folder is linked to the Netlify site', 'Run: netlify link');
else {
  const site = api('getSite', { site_id: siteId });
  if (!site) fail('the Netlify tool is signed in', 'Run: netlify login');
  else {
    pass(`this folder is linked to the Netlify site "${site.name}"`);
    if (site.build_settings?.repo_branch === 'main') pass('the site publishes from the main branch');
    else fail('the site publishes from the main branch', `The site's production branch is "${site.build_settings?.repo_branch ?? 'not set'}". Set it to main.`);
    const linkedRepo = site.build_settings?.repo_path ?? site.build_settings?.repo_url ?? '';
    if (repo && linkedRepo.replace(/\.git$/, '').replace(/^.*github\.com[:/]/, '') === repo) pass(`the site deploys from ${repo}`);
    else fail(`the site deploys from ${repo}`, `In Netlify, link the site to the GitHub repository ${repo} (it is linked to "${linkedRepo || 'nothing'}").`);
    if (site.functions_region === REGION) pass(`functions run in ${REGION}`);
    else fail(`functions run in ${REGION}`, `The site's functions region is ${site.functions_region}. Set it to ${REGION}.`);

    const variables = api('getEnvVars', { account_id: site.account_id, site_id: siteId });
    if (!variables) fail('the site variables can be read', 'Could not list the site variables.');
    else {
      const contextsOf = (name) => variables.find((entry) => entry.key === name)?.values ?? [];
      for (const [name, contexts] of Object.entries(NETLIFY_VARIABLES)) {
        for (const context of contexts) {
          const has = contextsOf(name).some((value) => value.context === context || value.context === 'all');
          if (has) pass(`${name} is set for ${context}`);
          else fail(`${name} is set for ${context}`, `Set ${name} for the ${context} context in Netlify.`);
        }
      }
    }
    const address = site.ssl_url || site.url;
    if (address) console.log(`\nLive address: ${address}`);
  }
}

console.log(failures === 0 ? '\nPreflight passed. Ready to start.' : `\nPreflight found ${failures} problem${failures === 1 ? '' : 's'}. Nothing was changed.`);
process.exit(failures === 0 ? 0 : 1);
