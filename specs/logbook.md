# Logbook

Dated entries written in Markdown, each optionally tied to a project. Several entries a day are normal. No tags, math, dictation, attachments, or search.

## Data

`log_entries`:

| Field | Rules |
|---|---|
| `id`, `user_id` | Owner required |
| `entry_date` | Calendar date in the user's time zone, today or earlier. A new entry starts as today |
| `project_id` | Optional; one of the user's projects; emptied if the project is deleted |
| `body` | 1–20,000 characters of Markdown, with something other than spaces and line breaks. Stored exactly as typed |
| `created_at`, `updated_at` | |

## Rules

- **Title.** An entry's title is its first non-empty line with Markdown marks removed (leading `#`, `-`, `*`, `>` and numbering; `*`, `_`, and backticks anywhere), cut to 120 characters. The server works it out and returns it with each entry; it is never stored.
- **Order.** Newest `entry_date` first, then newest `created_at` first.
- **Saving** happens only on **Create** or **Save**. Nothing is saved automatically. Leaving the form with unsaved text brings up the browser's own "leave this page?" warning.
- A date that is not a real calendar date answers 400 with "Choose a valid date."; a future one with "The date cannot be later than today."
- A body that is empty, or only spaces and line breaks, answers 400 with "Enter an entry." The text area's accessible name is "Entry".
- A `project_id` that is another user's, or does not exist, answers the same 400: "Choose a valid project."

## Formatted text

One `Markdown` component shows an entry's body everywhere it appears, using `react-markdown` with `remark-gfm`.

- Shown: headings, bold, italic, bulleted and numbered lists, links, inline code, code blocks, block quotes, tables.
- HTML typed into an entry is shown as text and never run.
- Links open in a new tab. An image is shown as a link to it, not loaded.
- Styled with the design tokens (today.md): headings in the display font, code on the muted background, table borders in the border color. No typography plugin.

## Operations

| Operation | Endpoint |
|---|---|
| List | `GET /api/log-entries?project=<id>&date=<date>` (both optional): the 100 newest matching entries, each with `id`, `date`, `title`, `body`, and its project's `id`, `name`, and `color` |
| Create | `POST /api/log-entries` |
| Read | `GET /api/log-entries/:id` |
| Update | `PATCH /api/log-entries/:id` |
| Delete | `DELETE /api/log-entries/:id` |
| Dates with a saved plan | `GET /api/logbook/plan-dates`: dates in the last 60 days that have a saved Daily Plan, newest first. Built in Phase 5 |

## Screens

**Logbook card on Today:** today's entries, each a row with its project tag and title. A row opens the entry's page.

```
Logbook                                             [ New entry ]

● Customer research    Two customer calls
● Launchpad            Onboarding sketch
```

Empty: "No entries today." with **New entry**.

**Logbook page** (`/logbook`): entries grouped by date, newest first.

```
Logbook                       [ All projects ▾ ]    [ New entry ]

Tue, Nov 10                                           Plan saved
   ● Customer research    Two customer calls
   ● Launchpad            Onboarding sketch
Mon, Nov 9
   ● Customer research    Pricing survey drafted
Sun, Nov 8                                            Plan saved
   No entries
```

- A date heading opens that day's view. A row opens the entry's page. An entry with no project shows a neutral dot and "No project".
- The project filter lists **All projects** and each project. The choice is kept in the address (`/logbook?project=<id>`). With a project chosen, only dates with matching entries show, and no plan markers.
- "Plan saved", and dates that have only a saved plan, arrive in Phase 5.
- Empty: "No entries yet. Write your first one." with **New entry**. A filter that matches nothing: "No entries for this project."

**Entry form** (`/logbook/new` and `/logbook/entries/<id>/edit`):

```
New logbook entry
Write in Markdown.

[ No project ▾ ]   [ date ]
[ Preview ]   [ Cancel ]   [ Create ]
┌──────────────────────────────────────────────────────────────┐
│ # Today's work                                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
Markdown: **bold**, *italic*, # headings, lists, `code`, tables, links.
```

- The text area is in a monospace font, at least 16 lines tall, and grows with its text. Its placeholder is "# Today's work".
- **Preview** replaces the text area with the formatted text, and the button then reads **Write**, which returns to the text area. The same button, so keyboard focus stays put.
- **Create** is disabled while the body is empty and while saving. After a create or a save, the entry's page opens.
- **Cancel** returns to the page the user came from.
- `/logbook/new?project=<id>` starts with that project chosen.
- Editing: the title reads "Edit logbook entry" and the button **Save**.
- If saving fails: "Couldn't save the entry." above the buttons, with the text kept.

**Entry page** (`/logbook/entries/<id>`): a "Logbook" link back, the date as the title (`Tuesday, November 10`, with the year added when it is not this year), the project tag, the formatted body, and **Edit** and **Delete**. Delete asks "Delete this entry?" and then returns to the Logbook page. An ID that does not exist, or is another user's, goes to the Logbook page.

**Day view** (`/logbook/day/<date>`): a "Logbook" link back, the date as the title, that day's entries in full, each with its project tag and an **Edit** link, and **New entry**. From Phase 5, that day's saved Daily Plan follows, read-only, when there is one (daily-plan.md). A future or invalid date goes to the Logbook page.

The entry page and the day view are built on the server with their content in place, so they have no loading state. Only **Delete** needs the browser.

**On the Projects page:** each row's counts include the project's entries ("3 ToDos · 1 event · 4 entries"), and the form of an existing project has a link, **View logbook entries**, to `/logbook?project=<id>`.

## Acceptance criteria

- **LOG-1** `[test]` A created entry is returned by Read and by List with its date, project, body, and title.
- **LOG-2** `[test]` The title of "# Two customer calls" is "Two customer calls"; of "- **Shipped** the survey", "Shipped the survey"; leading blank lines are skipped; a long first line is cut to 120 characters.
- **LOG-3** `[test]` List returns two entries of the same date, and orders by newest date and then newest created.
- **LOG-4** `[test]` The `project` filter returns only that project's entries, and the `date` filter only that date's.
- **LOG-5** `[test]` A body of only spaces and line breaks, or of 20,001 characters, answers 400 and stores or changes nothing.
- **LOG-6** `[test]` With a fixed clock at 23:50 in the user's zone, an entry dated that day or earlier is accepted, and one dated the next day is rejected with the message.
- **LOG-7** `[test]` Another user's project, or a missing one, as `project_id` answers the same 400.
- **LOG-8** `[test]` Reading, updating, or deleting another user's entry answers 404 and changes nothing, and List never includes it.
- **LOG-9** `[test]` An update changes the body, the date, and the project; `null` clears the project.
- **LOG-10** `[test]` Deleting a project keeps its entries, now with no project, and the project list gives each project's count of entries.
- **LOG-11** `[test]` The formatted text of a heading, bold text, a list, a link, and a table contains those elements; `<script>` typed into an entry appears as text; an image appears as a link.
- **LOG-12** `[test]` Preview shows the same formatted text as the entry's page for the same body, and **Create** is disabled for an empty body.
- **LOG-13** `[test]` A date with a saved plan and no entries appears on the Logbook page with "No entries" and "Plan saved"; with a project chosen it does not appear.
- **LOG-14** `[owner]` The Logbook page, an entry's page, and the form show the demo entries, formatted.
- **LOG-15** `[owner]` The form can be filled in and saved with the keyboard alone.
