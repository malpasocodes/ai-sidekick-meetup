// Live check: proves that the commit just pushed is the one Netlify publishes,
// and that the live site serves both the app and the files its pages load.
//
//   node scripts/live-check.mjs             waits for Netlify to publish this
//                                           commit, then checks the live address
//   node scripts/live-check.mjs <address>   checks that address now, without waiting
//
// It needs no installed packages, prints no secret, and changes nothing.
// Exit code 0 means every check passed.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const WAIT_MINUTES = 10;
const POLL_SECONDS = 10;
const MAX_FILES = 12;

let failures = 0;
const pass = (what) => console.log(`  ok    ${what}`);
const fail = (what, fix) => {
  failures += 1;
  console.log(`  FAIL  ${what}\n        -> ${fix}`);
};
const section = (name) => console.log(`\n${name}`);
const finish = () => {
  console.log(failures === 0 ? '\nLive check passed.' : `\nLive check found ${failures} problem${failures === 1 ? '' : 's'}. Nothing was changed.`);
  process.exit(failures === 0 ? 0 : 1);
};
const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

/** Runs a command and returns its output, or null when it fails. */
function run(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return null;
  }
}

const netlify = (args) => run('npx', ['--no-install', 'netlify', ...args]) ?? run('netlify', args);
const api = (method, data) => {
  const output = netlify(['api', method, '--data', JSON.stringify(data)]);
  try {
    return output ? JSON.parse(output) : null;
  } catch {
    return null;
  }
};

/** Asks for one address without following a redirect. Returns null when nothing answers. */
async function get(url) {
  try {
    return await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15_000) });
  } catch {
    return null;
  }
}

let address = process.argv[2]?.replace(/\/+$/, '') ?? null;

// -------------------------------------------------------------- publish
if (address) {
  if (!/^https?:\/\//.test(address)) {
    console.log(`"${address}" is not an address. Give one that starts with https://, or none to check the live site.`);
    process.exit(1);
  }
} else {
  section('Publish');
  const head = run('git', ['rev-parse', 'HEAD'])?.trim();
  const siteId = existsSync('.netlify/state.json')
    ? JSON.parse(readFileSync('.netlify/state.json', 'utf8')).siteId
    : null;
  if (!head) fail('this folder is a Git repository', 'Run the live check from the project folder.');
  else if (!siteId) fail('this folder is linked to the Netlify site', 'Run: netlify link');
  else if (run('git', ['merge-base', '--is-ancestor', head, 'origin/main']) === null) {
    fail('this commit is pushed', `The commit ${head.slice(0, 7)} is not on origin/main, so Netlify has nothing to publish. Push main first.`);
  } else {
    pass(`the commit ${head.slice(0, 7)} is pushed`);
    const deadline = Date.now() + WAIT_MINUTES * 60_000;
    let said = false;
    let lastState = 'not started';
    for (;;) {
      const site = api('getSite', { site_id: siteId });
      if (!site) {
        fail('the Netlify tool is signed in', 'Run: netlify login');
        break;
      }
      address = (site.ssl_url || site.url || '').replace(/\/+$/, '');
      if (site.published_deploy?.commit_ref === head) {
        pass(`Netlify publishes the commit ${head.slice(0, 7)}`);
        break;
      }
      const deploy = (api('listSiteDeploys', { site_id: siteId }) ?? []).find((entry) => entry.commit_ref === head);
      if (deploy) lastState = deploy.state;
      if (deploy?.state === 'error') {
        fail(`Netlify publishes the commit ${head.slice(0, 7)}`, `The build failed${deploy.error_message ? `: ${deploy.error_message}` : ''}. The live site still shows the commit before it.`);
        break;
      }
      if (Date.now() > deadline) {
        fail(`Netlify publishes the commit ${head.slice(0, 7)}`, `Not published after ${WAIT_MINUTES} minutes (its deploy is "${lastState}"). The live site shows ${site.published_deploy?.commit_ref?.slice(0, 7) ?? 'no commit'}.`);
        break;
      }
      if (!said) console.log(`  ...   waiting for Netlify to publish ${head.slice(0, 7)} (up to ${WAIT_MINUTES} minutes)`);
      said = true;
      await sleep(POLL_SECONDS);
    }
  }
  // An unpublished commit makes every later line describe the wrong version.
  if (failures > 0 || !address) finish();
}

// ------------------------------------------------------------------ app
section(`App, at ${address}`);
const signIn = await get(`${address}/sign-in`);
const html = signIn?.status === 200 ? await signIn.text() : '';
if (signIn?.status === 200) pass('/sign-in answers 200');
else fail('/sign-in answers 200', signIn ? `It answered ${signIn.status}.` : 'Nothing answered.');

const home = await get(`${address}/`);
const target = home?.headers.get('location') ?? '';
const redirects = home && home.status >= 300 && home.status < 400 && new URL(target, address).pathname === '/sign-in';
if (redirects) pass('/ redirects to /sign-in');
else fail('/ redirects to /sign-in', home ? `It answered ${home.status}${target ? `, pointing at ${target}` : ''}.` : 'Nothing answered.');

// Every path under /api/ is guarded by its prefix (specs/access.md), so one that does not exist will do.
const endpoint = await get(`${address}/api/live-check`);
if (endpoint?.status === 401) pass('/api/live-check answers 401');
else fail('/api/live-check answers 401', endpoint ? `It answered ${endpoint.status}.` : 'Nothing answered.');

// ---------------------------------------------------------- page files
// A page that answers 200 can still arrive without its scripts and styles.
// That happens when Netlify publishes the wrong folder: each file is then
// answered by the app, as a redirect to /sign-in, instead of as a file.
section('Page files');
const KINDS = { css: 'css', js: 'javascript', mjs: 'javascript' };
const files = [...new Set([...html.matchAll(/["'](\/_astro\/[^"'\s<>]+)["']/g)].map((match) => match[1].replace(/&amp;/g, '&')))];
if (!html) fail('the sign-in page links its scripts and styles', 'The page could not be read (see above).');
else if (files.length === 0) fail('the sign-in page links its scripts and styles', 'The page links no file under /_astro/. The build is not the one being served.');
else {
  for (const file of files.slice(0, MAX_FILES)) {
    const name = file.split('?')[0];
    const wanted = KINDS[name.split('.').pop()];
    const response = await get(`${address}${file}`);
    const type = response?.headers.get('content-type') ?? '';
    const isFile = response?.status === 200 && !type.includes('text/html') && (!wanted || type.includes(wanted));
    if (isFile) pass(`${name} loads (${type.split(';')[0]})`);
    else if (!response) fail(`${name} loads`, 'Nothing answered.');
    else if (response.status >= 300 && response.status < 400) fail(`${name} loads`, `It answered ${response.status}, a redirect to ${response.headers.get('location')}, instead of the file. Check that netlify.toml has: publish = "dist"`);
    else fail(`${name} loads`, `It answered ${response.status} as "${type || 'no type'}".`);
  }
}

if (failures === 0) console.log(`\nLive address: ${address}`);
finish();
