# Today screen, shell, and design tokens

[`layout.png`](layout.png) shows the visual direction. Where it differs from this spec, the spec wins: the mock says "AI Entrepreneur" where the app says **AI Sidekick**, omits the ToDos entry, and shows no checkboxes in the app.

## Design tokens

| Token | Value | Use |
|---|---|---|
| background | `#f6f3ec` | Page |
| card | `#fbf9f5` | Cards |
| foreground | `#26231f` | Text |
| muted / muted-foreground | `#efeadd` / `#645f56` | Quiet areas, secondary text |
| border | `#ddd7ca` | Card and field borders |
| primary / on primary | `#2f5c40` / `#fbf9f5` | Main buttons, focus ring, the wordmark |
| destructive | `#b3402e` | Errors, "Overdue" |
| sage, soft, foreground | `#bfcbaa`, `#dfe6d5`, `#24452f` | Briefing banner, AI badges |
| terracotta, soft, foreground | `#d9a68e`, `#f1dccf`, `#7a4028` | High priority, accents |
| sand, slate, plum, moss | `#d8c59a`, `#a9b4bf`, `#b99bb4`, `#8f9a5b` | Project colors, with sage and terracotta |

Radius 0.75rem on cards. Body text Inter; display headings (page titles, card titles, the Today headline) Newsreader. Base text size 16px or larger; no gray-on-gray small print.

## Shell

```
┌────────────┬─────────────────────────────────────────────┐
│ AI Sidekick│                                             │
│            │   page content                              │
│ Today      │                                             │
│ Calendar   │                                             │
│ ToDos      │                                             │
│ Projects   │                                             │
│ Logbook    │                                             │
│            │                                             │
│ (AE) Name  │                                             │
│ Settings   │                                             │
│ Sign out   │                                             │
└────────────┴─────────────────────────────────────────────┘
```

- The current page's entry is marked to screen readers and shown on a sage-soft background with primary-colored text.
- Each entry has a small decorative icon before its name. The wordmark links to Today.
- Below 768 pixels wide the sidebar is replaced by a top bar with the wordmark and a menu button that opens the same navigation.

## Today screen

```
Tuesday, November 10                                   [ Add new ▾ ]
AI Entrepreneur Assistant

┌ ✦ MORNING BRIEFING │ ...                              │ [button] ┐
└─────────────────────────────────────────────────────────────────┘
┌ Daily plan ───────────────────┐ ┌ Logbook ────────────────────┐
│                               │ │                             │
└───────────────────────────────┘ └─────────────────────────────┘
┌ Today's calendar ─────────────┐ ┌ Projects ───────────────────┐
│                               │ │                             │
└───────────────────────────────┘ └─────────────────────────────┘
```

| Panel | Shows | Spec |
|---|---|---|
| Morning Briefing | The banner | briefing.md |
| Daily plan | Open ToDos until a plan exists for today | daily-plan.md, todos.md |
| Logbook | Today's entries, with **New entry** | logbook.md |
| Today's calendar | Today's events, with **+ Event** | events.md |
| Projects | Up to five projects, with **View all** | projects.md |

- The cards are in two columns from 1024 pixels wide, and one column below that.
- Under the date sits one line, "AI Entrepreneur Assistant", in the muted text color. Nothing else: no tagline.
- The header date is written as formatted (`Tuesday, November 10`), not in capitals as the mock shows.
- With no open ToDos, the Daily plan card shows "Nothing to do yet. Add a ToDo to get started." without a button.
- The whole screen is one React island. Each panel loads on its own: a slow or failing panel never blocks the others.
- Rows on the Today cards are read-only. Editing and deleting happen on each feature's page.
- At phone width the panels stack: Briefing, Daily plan, Today's calendar, Logbook, Projects.
- Until Phase 5, the Daily plan card shows its "no plan yet" state and the banner its "none yet today" state, with their buttons disabled.

## Add new

- **Add new** opens a menu: **ToDo**, **Event**, **Project**, **Logbook entry**.
- ToDo, Event, and Project open their create form in a dialog. On save the dialog closes and every panel that shows the record updates. A project's name and color appear on ToDo and event rows, so saving a project updates those panels too.
- **Logbook entry** goes to the new-entry page (`/logbook/new`).
- **Escape** closes the menu or dialog and returns focus to **Add new**.

## Acceptance criteria

- **TDY-1** `[owner]` The shell shows the wordmark, the five navigation entries, and the account; at 400 pixels wide it shows the top bar and menu button instead.
- **TDY-2** `[owner]` At 1280 pixels wide the Today screen matches the sketch.
- **TDY-3** `[owner]` At 400 pixels wide the panels stack in the stated order and nothing scrolls sideways.
- **TDY-4** `[test]` The header date is today's date in the user's time zone, not the server's.
- **TDY-5** `[test]` A ToDo, an event, and a project added through **Add new** appear in the Daily plan card's open-ToDo list, Today's calendar, and the Projects card without a reload.
- **TDY-6** `[test]` With AI not configured, every non-AI panel loads and saves normally.
- **TDY-7** `[test]` With the events request failing, the calendar card shows its error state and the other panels still show their data.
- **TDY-8** `[owner]` **Add new**, its menu, and each dialog work with the keyboard alone, and **Escape** returns focus to **Add new**.
