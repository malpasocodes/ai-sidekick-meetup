# ToDos

Work the user needs to do. Completing a ToDo is not part of this build: there is no checkbox, and `status` is always `open`.

## Data

`todos`:

| Field | Rules |
|---|---|
| `id`, `user_id` | Owner required |
| `title` | 1–200 characters, trimmed |
| `notes` | 0–2,000 characters |
| `priority` | `high`, `medium`, or `low`. Default `medium` |
| `due_date` | Optional calendar date |
| `project_id` | Optional; one of the user's projects; emptied if the project is deleted |
| `status` | `open` |
| `created_at`, `updated_at` | |

## Rules

- **Order,** everywhere ToDos are listed: due date ascending, no due date last; then priority, High first; then newest first.
- **Overdue:** the due date is before today in the user's time zone.
- A `project_id` that is another user's, or does not exist, answers 400 on that field. The two cases are indistinguishable.

## Operations

| Operation | Endpoint |
|---|---|
| List | `GET /api/todos`: the ToDos, and `today` (the user's current date), which the page needs for "Due today" and "Overdue" |
| Create | `POST /api/todos` |
| Update | `PATCH /api/todos/:id` |
| Delete | `DELETE /api/todos/:id` |

## Screens

**ToDo row,** one component used on the ToDos page and in the Daily plan card:

```
Review customer interview notes
Medium · Overdue, was due Nov 9 · ● Customer research

Sketch the onboarding flow
High · Due today · ● Launchpad

List open questions for the next idea
Medium · ● Launchpad
```

- Title on the first line. Below it, in this order and separated by dots: priority, due date, project tag. Parts that do not apply are left out; priority always shows. When the line wraps at phone width, no dot starts or ends a line.
- **High** is a terracotta label. **Medium** and **Low** are plain muted text.
- Due date reads "Due today", "Due tomorrow", "Due Nov 14", or, in the destructive color, "Overdue, was due Nov 9".
- On the ToDos page a row opens the form in a dialog, with **Delete** inside it. On Today the rows are read-only.

**ToDos page:** the full list in the stated order, with **New ToDo**. Empty: "Nothing to do yet. Add a ToDo to get started."

**Form:**

```
Title      [                                   ]
Notes      [                                   ]
Priority   [ Medium ▾ ]      Due date  [ date  ]
Project    [ None ▾ ]
                               [ Cancel ] [ Save ]
```

## Acceptance criteria

- **TODO-1** `[test]` A ToDo created with a due date and a project is returned by List with both.
- **TODO-2** `[test]` ToDos due today, due next week, and with no due date are listed in that order.
- **TODO-3** `[test]` A ToDo due yesterday is overdue; after a time zone change that makes yesterday today, it is not.
- **TODO-4** `[test]` An empty title, or one of 201 characters, answers 400.
- **TODO-5** `[test]` Another user's project, or a missing one, as `project_id` answers the same 400.
- **TODO-6** `[test]` Delete removes the ToDo; updating or deleting another user's ToDo answers 404, and List never includes it.
- **TODO-7** `[test]` A ToDo created without a priority is `medium`; any value other than the three answers 400.
- **TODO-8** `[test]` Of two ToDos due the same day, High comes before Low; a ToDo due sooner comes before a High one due later.
- **TODO-9** `[owner]` The ToDos page shows the demo ToDos in order, with the High label, "Overdue, was due …" in the destructive color, and project tags.
- **TODO-10** `[test]` The Daily plan card's open-ToDo list is the first five in list order, with **View all** when there are more.
- **TODO-11** `[owner]` The form can be filled in and saved with the keyboard alone.
