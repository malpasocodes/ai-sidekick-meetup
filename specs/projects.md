# Projects

A project names an initiative, so ToDos, events, and logbook entries have context. It is a label, not project management: no status, deadlines, or sharing.

## Data

`projects`:

| Field | Rules |
|---|---|
| `id`, `user_id` | Owner required |
| `name` | 1–80 characters, trimmed; unique per user, ignoring case |
| `description` | 0–280 characters |
| `color` | `sage`, `terracotta`, `sand`, `slate`, `plum`, or `moss`. Default: the first of these the user has not used yet, or `sage` when all are used |
| `created_at`, `updated_at` | |

ToDos, events, and logbook entries point to a project with `project_id`, which the database sets to empty when the project is deleted.

## Operations

| Operation | Endpoint |
|---|---|
| List | `GET /api/projects` (with each project's count of open ToDos and of events starting now or later) |
| Create | `POST /api/projects` |
| Read | `GET /api/projects/:id` |
| Update | `PATCH /api/projects/:id` |
| Delete | `DELETE /api/projects/:id` |

A duplicate name answers 400 on the name field: "You already have a project with this name."

## Screens

**Projects page**, alphabetical by name:

```
Projects                                              [ New project ]

● Customer research     Interviews, and what we learn     3 ToDos · 1 event
● Launchpad             Exploring the next idea           2 ToDos · 2 events
```

- Clicking a row opens the form in a dialog, filled in, with **Delete** inside it. There is no separate project page.
- **Form:** Name, Description, Color (six swatches, each with its name as an accessible label).
- **Delete** asks: "Delete <name>? Its ToDos, events, and logbook entries will be kept without a project."
- From Phase 3 each row's counts include logbook entries, and the form of an existing project links to them (logbook.md).
- **Empty:** "No projects yet. A project groups related ToDos and events." with **New project**.

**Projects card on Today:** up to five projects, most recently updated first, each with swatch, name, and description; **View all** when there are more. Same empty state.

**Project tag** (used on ToDo and event rows): a small dot in the project's color, then its name.

## Acceptance criteria

- **PRJ-1** `[test]` A created project is returned by List, and appears on the page and the Today card without a reload.
- **PRJ-2** `[test]` A second project named "workshop" when "Workshop" exists is rejected with the message above.
- **PRJ-3** `[test]` An empty name, or one of 81 characters, answers 400 with a message on the name field.
- **PRJ-4** `[test]` Renaming a project changes the tag on its ToDos and events.
- **PRJ-5** `[test]` Deleting a project keeps its ToDos and events, now with no project.
- **PRJ-6** `[test]` Reading, updating, or deleting another user's project answers 404 and changes nothing.
- **PRJ-7** `[test]` With no projects, the empty state and **New project** show on the page and the card.
- **PRJ-8** `[owner]` The form can be filled in and saved with the keyboard alone.
- **PRJ-9** `[owner]` The Projects page shows each project's swatch, name, description, and counts.
