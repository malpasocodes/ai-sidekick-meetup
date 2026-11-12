# Stack

The technology, the environments, and the rules every feature follows. Each fact lives here once; other documents link to it.

## Versions

Install these major versions and commit the lockfile. Node is pinned in `.nvmrc` and `engines`.

| Concern | Package | Version |
|---|---|---|
| Runtime | Node.js | 22.23.4 |
| Framework | `astro`, server output, with `@astrojs/netlify` and `@astrojs/react` | 7, 8, 7 |
| Interface | `react`, `react-dom` | 19 |
| Styling | `tailwindcss` with `@tailwindcss/vite`; shadcn/ui components (`radix-ui`, `lucide-react`) and their helpers (`class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`) | 4 |
| Fonts | `@fontsource-variable/inter` (body), `@fontsource-variable/newsreader` (display headings) | 5 |
| Validation | `zod` | 4 |
| Markdown | `react-markdown`, `remark-gfm` | 10, 4 |
| Sign-in | `@clerk/astro` | 4 |
| Database | `@neondatabase/serverless` (HTTP driver), `drizzle-orm`, `drizzle-kit` | 1, 0.45, 0.31 |
| Test database | `@electric-sql/pglite` | 0.5 |
| AI | `@mistralai/mistralai` | 3 |
| Tests | `vitest` | 5 |
| Type check | `@astrojs/check`, with `@types/node`, `@types/react`, `@types/react-dom` | 0.9 |
| Scripts | `tsx`, `typescript` (6 on purpose, though newer exists) | 4, 6 |

Nothing else without a reason stated in the gate report. Not used: streaming, model tool calling, Clerk webhooks, background jobs, dark mode, a state library, a browser-automation package.

## Environments

| | Local | Production |
|---|---|---|
| Address | `http://localhost:4321` | The live address the preflight prints |
| Database (Neon branch) | `dev` | `production` |
| Clerk | the same development instance and keys in both | |
| Who may sign in | the owner | the owner |
| AI | real | real |

Pushing `main` publishes to production. A failed build is never published, because Netlify's build command is `npm run check`. `netlify.toml` names both that command and the folder to publish, `dist`, where Astro writes the browser's files (scripts, styles, fonts). The Netlify site is created before the app exists, so Netlify can detect neither. The database and Netlify's functions are in the same region, `us-east-1`. There is no custom domain and no Clerk production instance.

### Variables

The app reads these through `astro:env/server`, declared in `astro.config.mjs` (the Clerk integration declares its own two keys; declare the other four). Values are already set in `.env` and in Netlify. `.env.example` lists the names.

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | Connection string for the environment's branch |
| `PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk keys. Only the first may reach the browser |
| `ALLOWED_CLERK_USER_IDS` | Comma-separated Clerk user IDs. Empty means nobody. The first is the owner |
| `AI_API_KEY` | Mistral key. Without it the AI features are unavailable and everything else works |
| `AI_DAILY_GENERATION_LIMIT` | Default 20 |

Scripts only, never the app: `PRODUCTION_DATABASE_URL`, in `remote.env`, for `npm run db` and `npm run demo`.

## Where code goes

```
src/pages/                 Astro pages. src/pages/api/** are thin endpoints
src/components/<feature>/  React islands and their parts
src/lib/<feature>/         schema.ts      Zod shapes, shared by form and server
                           repository.ts  queries; every function takes the user ID
                           api.ts         operations: validate, authorize, query, answer
                           client.ts      the browser's calls to the endpoints
                           api.test.ts    tests of api.ts against PGlite
src/lib/ai/                the AI adapter (specs/ai.md)
src/lib/auth/              allowlist, access decisions, current user (specs/access.md)
src/lib/server/            request context and response helpers
src/db/schema.ts           Drizzle tables;  drizzle/  migration files
scripts/                   preflight, db, demo data, the AI test call
```

An operation in `api.ts` takes the database, the current user, and the input, and returns a status and a body. An endpoint only builds the request context, calls one operation, and sends the answer. That is what lets tests run every operation with a temporary database and a made-up user, without Clerk.

## Rules

**Pages and components**

- Pages render on the server, on demand. Nothing personal is prerendered.
- One React island per page holds everything that shares state, including its dialogs.
- Components take data through props. Hooks in the island do the fetching.
- Colors, fonts, and radii are design tokens (specs/today.md). No hard-coded colors, except the dimmed backdrop that shadcn/ui puts behind a dialog. Raise shadcn/ui's small text (`text-sm`) to the base size.
- Every panel has loading, empty, error (with **Try again**), and populated states.
- Every button, field, and link has an accessible name; decorative icons are hidden from screen readers. No screen scrolls sideways at 400 pixels wide.

**Validation**

- One Zod schema per shape, used by the form and the server. Types are derived from it.
- The server validates every input before any database work.

**Sign-in and ownership** (details in specs/access.md)

- Middleware verifies the session, then the allowlist. Every operation checks both again through the current-user helper.
- Every table row carries its owner's internal user ID, and every query filters by it.

**Database**

- Server code only, through Drizzle and the HTTP driver.
- Constraints enforce uniqueness, relationships, and allowed values (a color, a priority, an end after its start). Deleting a user row deletes that user's records.
- Migrations are files in `drizzle/`, written by `npm run db:generate` and applied only by `npm run db -- migrate <target>`, never by a build. They only add.
- The `db` script names its target, reads `remote.env` for `production`, and refuses when the two connection strings are equal.

**AI** (details in specs/ai.md)

- Feature code calls one function, `generateStructured`. The Mistral package is imported in one file.
- The app owns the facts: the model never supplies a title, time, or date that the app shows as a record.
- Nothing the model writes is stored or shown before it passes its schema and its feature's checks.
- The usage log stores counts, never prompt or response text.

**Git and release**

- Work on `main`. Clear commit messages that name the phase. Push only after the owner's go-ahead.
- Roll back by republishing an earlier deploy in Netlify; that does not restore data.
- `.env` and `remote.env` are never committed.

## Tests

- Vitest, with PGlite created fresh for each test file. No test imports the app's database connection or `src/lib/ai/mistral.ts`.
- Tests use the fake AI provider and a fixed clock where time matters.
- No browser simulator (no jsdom). What a panel shows for a given state is decided by plain functions, which are tested directly; components are rendered to static markup for the wording tests.
- Every acceptance criterion has an ID. A criterion marked `[test]` needs a test whose name starts with that ID. A criterion marked `[owner]` is checked by the owner on screen.
