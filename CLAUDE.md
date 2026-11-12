# AI Sidekick

A personal planning app (calendar, ToDos, projects, a logbook, and two AI features), built in five phases for a workshop demo. You build it. The owner approves each phase and is asked for nothing else. The owner is not a programmer: write to them in plain language.

This is a demo build. Keep it simple: no branches, no pull requests, no screenshots, no browser automation. The owner looks at the screens.

## What to read

1. [PLAN.md](PLAN.md): the current phase's section.
2. [STACK.md](STACK.md).
3. [specs/README.md](specs/README.md) and the specs the phase names.

## Commands

| Command | Does |
|---|---|
| `node scripts/preflight.mjs` | Checks every account, key, and link, and prints the live address. Exists already |
| `node scripts/live-check.mjs` | After a push: waits for Netlify to publish the commit, then checks the live site and the files its pages load. Exists already |
| `npm run dev` / `npm run stop` | Starts and stops the app at `http://localhost:4321` |
| `npm run check` | Type check, tests, production build. Also Netlify's build command |
| `npm run db -- <migrate\|status> <dev\|production>` | Migrations and status |
| `npm run db:generate` | Writes a migration file from `src/db/schema.ts`. Touches no database |
| `npm run demo -- <add\|remove> <dev\|production>` | The demo records (Phase 2) |
| `npm run ai:test-call` | Real calls to the model (Phases 4 and 5) |

## One phase, start to gate

1. Run the preflight. If a line fails, stop and show the owner that line. This is the only reason to ask the owner for anything.
2. Note the start time. Work on `main`. Commit as you go, each time after `npm run check` passes; **do not push**.
3. Build what the phase lists, to the specs. Name each test after its criterion (`TODO-3: ...`).
4. `npm run check` passes. Apply new migrations to `dev`. Leave the app running locally so the owner can look.
5. Give the gate report. **Stop.**

On the owner's go-ahead: apply new migrations to `production`, push `main`, run the live check below, tag `phase-N-done`, push the tag, tell the owner in one line that Phase N is live and at which address, and start the next phase without waiting for an answer.

The go-ahead must come from the owner, typed in this session. If the permission system refuses a production step, stop and show the owner the commands (`npm run db -- migrate production`, then `git push origin main`); do not look for another way.

If the owner asks for a change at the gate: change the spec first, then the code, and repeat steps 4 and 5.

**Live check:** `node scripts/live-check.mjs`. It waits for Netlify to publish the pushed commit, then checks that `/sign-in` answers 200, `/` redirects to `/sign-in`, a path under `/api/` answers 401, and the scripts and styles the sign-in page links load as files. If a line fails, do not tag the phase: tell the owner which line failed and what you propose.

You cannot sign in, so the owner's look is the only signed-in check, locally and live. That is why every gate report from Phase 2 on carries the `Live:` line.

## Gate report

```
Phase N: <name>            Started 14:02, gate 14:15
Built:      three or four lines
Checks:     npm run check: 0 errors, 64 tests pass, build completes
Look at:    http://localhost:4321, then the phase's "Look at" list from PLAN.md
Live:       <the live address> has Phase N-1. Sign in there once
Departures: anything that differs from a spec, and why. "None" if none
Ready to go live on your go-ahead.
```

Leave the `Live:` line out in Phase 1, when nothing is live yet.

## When something is unclear

Decide it yourself: take the smallest reading consistent with the specs, build that, and list it under Departures. Do not stop mid-phase to ask.

## Permissions

| Without asking | Only after the go-ahead | Never |
|---|---|---|
| Commit on `main` | Push `main` | Display, log, or commit a secret, or read `.env` or `remote.env` yourself (scripts read them) |
| Apply migrations to `dev` | Apply migrations to `production` | Change Netlify variables or Clerk settings |
| Add and remove the demo records in `dev` | Tag the phase | Delete records the owner created |
| | Add the demo records to `production`, when the owner asks | |

Migrations only add to the schema, so the published code keeps working between a migration and its push.

## Known traps

- `netlify.toml` must name the folder to publish: `publish = "dist"`. The Netlify site was created before the app existed, so Netlify cannot work it out. Without that line the live site answers every script and stylesheet with a redirect to `/sign-in`: pages load, and nothing on them works.
- Astro's dev server detaches and keeps running in the background. Stop it with `npm run stop`.
- Switch off Astro's developer toolbar in `astro.config.mjs` (`devToolbar: { enabled: false }`).
- `npx shadcn add` may install a package named `cn` and import from it. Uninstall it; the project's helper is `cn` in `src/lib/utils.ts`.
- A local build copies `.env` values into `.netlify/build/`, and the Netlify adapter rewrites `.netlify/state.json`. Both are expected: `.netlify/` is ignored by Git. Never add it.
- A file named `.env.production` is loaded into builds automatically. That is why the production connection string lives in `remote.env`.
- Clerk's `<SignOutButton>` takes no `class`. Use `asChild` with a `<button>` inside.
- `tsx -e` cannot use top-level `await`. Write a script file.
- In zsh, a loop variable named `path` replaces `PATH`.
- A file named like `schema 2.ts` is a file-sync copy. Delete it; never edit it.
- Mistral's strict JSON mode writes `null` for an optional field it leaves out. Accept that.
- Do not put an example sentence that names a record in the AI instructions. The model copies it onto unrelated records. State the rule instead.
- Write a database rule for "not blank" as a pattern (`~ '[^[:space:]]'`). Never type a real tab or line break inside a rule's SQL.
- With the pinned TypeScript 6, `tsconfig.json` cannot use `baseUrl`. Use `paths` alone.
- In a counting query nested inside another, write table names out in full, or it silently matches the wrong column.
- In zsh, quote a pattern such as `'*.test.*'`, or the shell treats it as file names.
