# Setup, before the agent starts (Phase 0)

For you, the owner. The agent does not need this file; it runs the preflight, which checks everything below.

Each step says what must be true when you are done. The services' screens change, so this file does not list every click. When a step is unclear, run the preflight (step 8): each failing line names what is missing and how to fix it.

## 1. Tools on your machine

| Tool | What is needed |
|---|---|
| Node.js | Version 22 (the exact version is in `.nvmrc`) |
| Git | Installed |
| GitHub command-line tool (`gh`) | Installed and signed in: `gh auth login` |
| Netlify command-line tool (`netlify`) | Installed and signed in: `npm install -g netlify-cli`, then `netlify login` |
| Claude Code | Installed and signed in |

Nothing else should be using the address `http://localhost:4321`. An app left running from another project will get in the way.

## 2. Your own copy of this repository

- On GitHub, press **Use this template** and create a repository under your own account. Private is fine.
- Download it: `gh repo clone <your-account>/<your-repository>`, and open that folder.

When you are done: the folder's `origin` is your repository, not the template.

## 3. Neon (the database)

- Create one project, in the region **AWS US East (N. Virginia)**, `us-east-1`.
- Give it two branches, named `dev` and `production`. Both stay empty.
- Copy each branch's connection string. They must be different.

## 4. Clerk (sign-in)

- Create one application. A new application is a development instance, which is what this build uses.
- Add yourself as a user, in Clerk's dashboard. The app has no sign-up page.
- Copy three things: the publishable key, the secret key, and your user ID (it begins `user_`).

## 5. Mistral (the AI model)

- Create an API key.
- Set a spending limit.

The preflight checks that this key can use the model named in `specs/ai.md`.

## 6. Two files in this folder, never committed

Both are already listed in `.gitignore`. Do not paste their contents into a chat with the agent.

`.env`: copy `.env.example` to `.env` and fill in the values.

- `DATABASE_URL`: the `dev` connection string
- `PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- `ALLOWED_CLERK_USER_IDS`: your Clerk user ID
- `AI_API_KEY`: the Mistral key

`remote.env`: copy `remote.env.example` to `remote.env` and fill in the value.

- `PRODUCTION_DATABASE_URL`: the `production` connection string

## 7. Netlify (the live site)

- Create a site from your GitHub repository (step 2), publishing from the branch `main`.
- Set the site's functions region to `us-east-1`.
- Set these variables on the site, for production: `DATABASE_URL` (the **`production`** connection string, not the `dev` one), `PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `ALLOWED_CLERK_USER_IDS`, `AI_API_KEY`.
- Link this folder to the site: run `netlify link` in the folder.

Until Phase 1 is published, the live address has no app to show. That is expected.

## 8. Proof

```
node scripts/preflight.mjs
```

Every line reads `ok`, and it ends with "Preflight passed. Ready to start." and your live address. The preflight changes nothing and prints no secret, so run it as often as you like.

## 9. Optional: fewer prompts from Claude Code

Claude Code asks your permission before it runs a command. To be asked less often for routine ones, run `/fewer-permission-prompts` in Claude Code. Production steps still wait for your go-ahead; that rule is in `CLAUDE.md`.

## Start

Open the folder in Claude Code and say: **Start Phase 1.**
