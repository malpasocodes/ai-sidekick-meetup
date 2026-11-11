# Specifications

One file per feature. Each gives the fields, the rules, a sketch of the screen, and numbered acceptance criteria. Text in quotation marks, and text in **bold**, is the exact wording the app shows.

| Spec | Covers | Phase |
|---|---|---|
| [access.md](access.md) | Sign-in, the allowlist, user records | 1 |
| [today.md](today.md) | Design tokens, the shell, the Today screen | 1, 3 |
| [settings.md](settings.md) | Time zone and "today" | 2 |
| [projects.md](projects.md) | Projects | 2 |
| [todos.md](todos.md) | ToDos | 2 |
| [events.md](events.md) | Events and the Calendar page | 2 |
| [demo-data.md](demo-data.md) | The records the demo uses | 2 |
| [logbook.md](logbook.md) | Logbook entries in Markdown, by project | 3 |
| [ai.md](ai.md) | The AI adapter, limit, and usage log | 4 |
| [daily-plan.md](daily-plan.md) | AI Daily Plan | 5 |
| [briefing.md](briefing.md) | AI Morning Briefing | 5 |

## Conventions

- **Ownership.** Every record belongs to the current user. A request for a record that is someone else's, or does not exist, answers **404**, so the answer never reveals whether it exists.
- **Signed out** answers **401** from endpoints; **not on the allowlist** answers **403** (access.md).
- **Validation.** Invalid input answers **400** with a message per field. The form shows the same messages inline, and its save button is disabled while saving. Unless a spec gives its own wording: a missing required field reads "Enter a <field>."; text that is too long reads "Keep this to <N> characters or fewer." (`2,000`, with the comma); a value outside a fixed set, a date that cannot be read, and a project that does not exist read "Choose a valid <field>."; a clock time not typed as 24-hour text reads "Enter the time as 14:00." A field is named as its form label, in lower case ("due date", "start time"). A value that breaks a rule gets a message that states the rule: "The end time must be different from the start time.", "The end time must be after the start time.", "An event can last at most 24 hours.", "The date cannot be later than today.", "The last date cannot be before the first date.", "A range can cover at most 62 days."
- **Updates** (`PATCH`): a field that is sent replaces the stored one, `null` clears an optional field, and a field left out is unchanged.
- **Another user's record** is never returned by any operation. Where a criterion says "reading" it and the feature has only a List, the test is that List never includes it.
- **States.** Every list and panel has loading, empty, error with **Try again**, and populated states. A list that fails to load is tried once more, after 0.8 seconds, before its error state shows.
- **Times.** Instants are stored in UTC and shown in the user's time zone. Due dates and log dates are plain calendar dates.
- **Formats.** Clock times `14:00` (24-hour). Short dates `Nov 11`. The Today header `Tuesday, November 10`.
- **Deletes** ask for confirmation: 'Delete "<title>"?' unless a spec gives its own question. In a form dialog the question replaces the form inside the same dialog, with **Cancel** (focused) and **Delete**; no second dialog opens.
- **Lists update without a reload** after a create, edit, or delete. The test for this is that List returns the change and the page renders what List returns.
- **Form controls.** Dates use the browser's date control. Clock times are typed as 24-hour text (`14:00`), because the browser's time control follows the machine's locale.
- **Focus.** Closing a dialog or menu, by Escape, Cancel, or a successful save, returns keyboard focus to the button or row that opened it. If that row is gone (a delete), focus goes to the list's create button.
- **Empty states** show the create button once, inside the empty panel, not also in the page header.
- **IDs** are UUIDs. `created_at` and `updated_at` are set by the server.

## Acceptance criteria

Each criterion has an ID and one tag:

- `[test]`: an automated test whose name starts with the ID.
- `[owner]`: the owner checks it on screen. Build to it; do not try to prove it.

"Sent directly to the server" means the operation is called without the form, as a test does.
