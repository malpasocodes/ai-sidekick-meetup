# AI Sidekick: starter kit

Everything you need to have an AI coding agent build AI Sidekick for you: a personal planning app with a calendar, ToDos, projects, a logbook, and two AI features (a Morning Briefing and a Daily Plan).

This repository contains **no app code**. It holds the specifications, the plan, and the instructions the agent follows. The agent writes the app, in five phases. At the end of each phase you look at the screens and approve, and the phase goes live.

## What is here

| File | What it is |
|---|---|
| [SETUP.md](SETUP.md) | What you set up before the agent starts. **Start here** |
| [specs/](specs/README.md) | One specification per feature: fields, rules, a sketch of the screen, and numbered acceptance criteria |
| [PLAN.md](PLAN.md) | The five phases, and what you look at when each one ends |
| [STACK.md](STACK.md) | The technology, and the rules every feature follows |
| [CLAUDE.md](CLAUDE.md) | The agent's instructions: how it runs a phase, what it may do without asking, and what waits for your go-ahead |
| `scripts/preflight.mjs` | A check that every tool, account, key, and link is in place. It changes nothing and prints no secret |
| `scripts/live-check.mjs` | A check the agent runs after each phase goes live: that Netlify published it, and that the live site serves the app and the files its pages load. It changes nothing and prints no secret |
| `.env.example`, `remote.env.example` | Templates for the two settings files you fill in. No values |

## How to begin

1. Press **Use this template** on GitHub to make your own copy of this repository. You need your own copy because your live site publishes from it.
2. Follow [SETUP.md](SETUP.md).
3. Run `node scripts/preflight.mjs` until every line reads `ok`.
4. Open the folder in Claude Code and say: **Start Phase 1.**

At the end of each phase the agent gives you a short report and stops. Look at the app, then tell it to go ahead. It publishes that phase and starts the next.

## Before you start: caveats

- **This is a demo build, not production software.** It admits one person, you. The live site uses Clerk's development sign-in, and there is no custom domain.
- **You need five accounts:** GitHub, Neon, Clerk, Netlify, and Mistral. Some of these may charge you. Check each one's current pricing, and set a spending limit on the Mistral key.
- **It assumes a Mistral model.** See "Using a different model" below.
- **It was written for, and run with, Claude Code.** Another agent may not follow `CLAUDE.md`.
- **It has been run on a Mac only.** Windows and Linux are untested.
- **Package versions are pinned as of November 2026** (see `STACK.md`). Later versions may behave differently.
- **Your build will differ from anyone else's.** The agent decides the details the specs leave open, and lists them for you at each gate under "Departures".
- **AI answers vary from run to run.** In the builds so far, the Morning Briefing has been accurate, apart from once counting an overdue ToDo as due today. The Daily Plan has at times listed items in the wrong order, linked records that have nothing to do with each other, or left out a ToDo that was due today.
- **Your accounts and keys are your responsibility.** The agent is told to push, and to change the production database, only on your go-ahead, and never to read or show your keys. Read `CLAUDE.md` ("Permissions") so you know what you are approving.
- **Timing.** The build this kit came from took about 50 minutes, with every account already in place and Claude Code allowed to run routine commands without prompting. Setup takes longer the first time.
- **Provided as is, with no support.** See [LICENSE](LICENSE).

## Using a different model

The kit names Mistral in five places:

| Where | What names Mistral |
|---|---|
| `specs/ai.md` | The model, `mistral-small-2603`, and the section on the real provider |
| `STACK.md` | The Mistral package, and the file it is imported in |
| `SETUP.md` and `.env.example` | The Mistral key |
| `scripts/preflight.mjs` | The check of the key and the model |
| `CLAUDE.md` | One known trap, about how Mistral writes a field it leaves out |

**If Mistral retires `mistral-small-2603`,** the preflight fails with a line that says the model is not available. Change the name in `specs/ai.md` and at the top of `scripts/preflight.mjs` to a current Mistral model, and run the preflight again.

**A different provider is untested.** The rest of the app does not depend on Mistral: the specs keep the provider in one file, behind one function. But the five places above would all need rewriting, and the instructions for the two AI features have only been tried with this model.

## License

MIT. See [LICENSE](LICENSE).
