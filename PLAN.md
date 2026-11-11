# Plan

Five phases, built on `main`. Each ends with a gate where the owner looks at the app and approves, and then it goes live. How a phase runs is in [CLAUDE.md](CLAUDE.md).

| Phase | Ends with | Tag |
|---|---|---|
| 1 Foundation, sign-in, first deploy | A signed-in, empty shell on the live address | `phase-1-done` |
| 2 Settings, projects, ToDos, events | Four working pages on real data | `phase-2-done` |
| 3 Logbook and Today | Markdown entries by project; the complete Today screen, AI buttons inactive | `phase-3-done` |
| 4 AI foundation | A limited, logged way to call the model | `phase-4-done` |
| 5 Morning Briefing and Daily Plan | Both AI panels working | `phase-5-done` |

## Every phase

- **Exit criteria** are the `[test]` criteria of the phase's specs: each has a passing test named after its ID. `[owner]` criteria are for the owner to look at; build to them, but do not try to prove them.
- **Look at** lists what the owner checks on screen at the gate. Copy it into the gate report.
- **Scope** is what the phase lists. Leave later phases' work alone, even when it looks easy.
- A criterion that depends on a later phase is listed under "Deferred" with the phase that closes it.
- A test of a button's or field's state checks its attribute (`disabled`, `aria-current`), never a word that could also appear in its styling.

---

## Phase 1: Foundation, sign-in, first deploy

**Specs:** `access.md`; `today.md` ("Design tokens" and "Shell" only).

**Build**

- The project: Astro with the Netlify adapter, React, Tailwind, shadcn/ui, Vitest, pinned as STACK.md lists. `netlify.toml` with build command `npm run check`.
- Design tokens and the shell: sidebar, navigation, and a placeholder page for each of Today, Calendar, ToDos, Projects, Logbook, Settings.
- Drizzle, the `users` table, PGlite test setup, and `npm run db` with `migrate` and `status` for the two targets.
- Sign-in, the allowlist, the current-user helper, the sign-in and access-denied pages, the account and **Sign out** in the sidebar.
- In the existing README, add a short section on how to start and stop the app and run each command. Keep the rest of the README as it is.

**Look at:** sign in; the sidebar shows your name and the six entries; each entry opens its placeholder page; **Sign out** returns to the sign-in page.

**Not in this phase:** any feature page content, the Today panels, AI.

## Phase 2: Settings, projects, ToDos, events

**Specs:** `settings.md`, `projects.md`, `todos.md`, `events.md`, `demo-data.md`.

**Build**

- The time zone setting first; the others depend on "today".
- Projects, ToDos, and events end to end: tables, schemas, operations, endpoints, pages, forms.
- The demo data script. Add the demo records to `dev` before the gate, so the owner sees filled pages.

**Look at:** the Projects, ToDos, and Calendar pages with the demo records; create, edit, and delete one ToDo; Settings shows your time zone.

**Deferred to Phase 3:** TODO-10, and the logbook parts of the Projects page (LOG-10). Where PRJ-1, PRJ-7, and EVT-1 mention the Today card, test the page here; the card is covered in Phase 3.

**Not in this phase:** the Today screen, the logbook, ToDo completion (never in this build; the `status` column stays `open`).

## Phase 3: Logbook and Today

**Specs:** `logbook.md`, `today.md`.

**Build**

- Logbook entries: the table, operations, and endpoints; the `Markdown` component; the Logbook page with its project filter, the entry form with **Preview**, the entry page, and the day view.
- On the Projects page: the entry count on each row and the **View logbook entries** link.
- Add the demo entries to the demo data script and to `dev`.
- The Today screen: header, **Add new** menu, and the five panels. The Daily plan card shows its "no plan yet" state with the open-ToDo list; the Briefing banner shows its "none yet today" state. Both AI buttons are present and disabled.

**Look at:** the Logbook page with the demo entries; filter by a project; write a new entry with a heading and a list, press **Preview**, then **Create**; the Today screen with all five panels.

**Deferred to Phase 5:** LOG-13 (needs saved plans), TDY-6.

**Not in this phase:** anything that calls the model; "Plan saved" on the Logbook page.

## Phase 4: AI foundation

**Specs:** `ai.md`.

**Build**

- The adapter, the real provider, the fake provider for tests, the daily limit, the usage log.
- `npm run ai:test-call`: one small real call per feature against `dev`, under that feature's own output cap and deadline, with a small built-in sample. It prints the outcome and the token counts, never the key. It runs as a throwaway user that it creates and then deletes along with its usage rows.

**Also:** the test call completes for both features within their deadlines. If it does not, report the measured times in the gate report.

**Look at:** nothing changes on screen. The gate report shows the two real calls and their times.

**Not in this phase:** the two features, and any change to a screen.

## Phase 5: Morning Briefing and Daily Plan

**Specs:** `briefing.md`, `daily-plan.md`.

**Build,** in this order, with a commit after each:

1. The Briefing: what is sent, the instructions, the server checks, the endpoints, and the banner in every state of its table.
2. The Daily Plan: the same, plus the draft, Save, the saved plan in the Logbook's day view, and "Plan saved" on the Logbook page.

**Also**

- Extend `npm run ai:test-call` to run each feature once for real on the demo set and print the answer. Read each answer against the demo data and quote it in the gate report, marking anything invented or unsupported (a guessed duration, a reason that links unrelated records).
- Check each real plan against daily-plan.md, "A good plan for the demo data". You may adjust the instructions twice after reading real answers, and make at most eight real calls in the phase. Say what you changed and why.

**Look at:** on Today, **Create briefing**; **Create daily plan**, edit the focus, remove an item, **Save plan**; the saved plan on today's day view in the Logbook.

**Exit criteria** also include LOG-13 and TDY-6.

**Not in this phase:** new record types, scheduled generation.

**After this phase:** the build is complete. Further changes follow the same loop: build, gate, go-ahead, push.
