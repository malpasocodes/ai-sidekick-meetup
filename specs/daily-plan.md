# Daily Plan

On request, a suggested focus and order of work for today, built from the user's own records, as a draft the user edits and saves. Nothing is generated automatically, and a plan never creates or changes a record.

## What the model is sent

Each record carries a short reference (`t1`, `e1`, `p1`) that the model must use to point at it.

- Today's date and the time zone.
- Open ToDos, up to 50 in list order: reference, title, due date, priority, project name.
- Events today and tomorrow: reference, title, start and end, project name.
- Projects: reference, name, description.
- Logbook entries dated today or the two dates before it, newest first, up to 10: date, project name, and the first 2,000 characters of the body.

**Too little information:** no open ToDos, no events today or tomorrow, and no such entries. The model is not called.

## What the model returns

```
focus: text, 1–200 characters
items: 1–8, each one of
  { kind: "todo" | "event", ref, note?: text ≤ 140 }
  { kind: "suggestion", title: text 1–200, projectRef?, note?: text ≤ 140 }
```

Ask the model for one flat item shape (`kind`, `ref`, `title`, `projectRef`, `note`, each optional except `kind`), which strict JSON output handles best; the server then holds each kind to its own fields.

The instructions ask for:

- events in time order with ToDos placed around them, and a ToDo that prepares for an event (same project, or a logbook entry links them) placed before that event;
- no ToDo or event twice, and no suggestion that repeats or rephrases an existing ToDo;
- no durations or times the records do not contain, and no words that guess one ("quick", "brief");
- a focus that names only what the records hold;
- a note only when it gives a reason from another record (an event, or a logbook entry), never the item's own title, priority, or due date; no note on an event.

### A good plan for the demo data

Used in Phase 5 to judge real answers:

- "Review customer interview notes" comes before the 10:00 Customer conversation.
- "Sketch the onboarding flow" comes before the 14:00 Launchpad check-in.
- Both of today's events appear, in time order.
- Every note names an event or something a logbook entry says.
- The focus mentions one conversation, not several.

## Server checks

- Every `ref` and `projectRef` must be one that was sent, and its record must still exist and belong to the user. **One bad reference rejects the whole draft** (`failed`).
- An item of the wrong shape for its kind (a suggestion with no title, a ToDo with no `ref`) rejects the whole draft.
- A ToDo or event listed a second time is dropped, keeping the first. A suggestion whose title equals an open ToDo's title, ignoring case and spacing, is dropped. A suggestion that only rephrases a ToDo cannot be caught here; the instructions must prevent it. If nothing is left after the drops, the draft is rejected (`failed`). The instructions also forbid words that guess a duration ("quick", "quickly", "brief"); real answers used them in two of three runs, so name the words.
- A note on an event that has nothing left once clock times and words such as "at", "from", and "starts" are removed is dropped.
- The draft the browser receives is built from the server's records: titles, times, priorities, due dates, and projects never come from the model.
- **Save** takes `{ focus, items }`, each item as `{ kind, id }` or `{ kind: "suggestion", title, projectId }`, with an optional `note`. It accepts today's date only (otherwise 400: "A plan can be saved for today only."), needs a focus ("Enter a focus.") and one to eight items ("A plan needs at least one item."), checks every reference again, and stores each item with its title as it is at that moment. It replaces any plan already saved for today.

## Data

`saved_plans`: `id`, `user_id`, `plan_date` (unique per user), `focus`, `items` (JSON: kind, record ID, saved title, note, and a suggestion's project ID), `created_at`, `updated_at`.

Read answers 200 with `{ plan: null }` when no plan is saved for the date. It returns each item with its record's current details when the record still exists, and with its saved title and `deleted: true` when it does not. "Tomorrow" on an event means the day after the plan's date.

## Operations

| Operation | Endpoint |
|---|---|
| Generate a draft | `POST /api/ai/daily-plan` (stores nothing) |
| Save | `PUT /api/plans/:date` |
| Read | `GET /api/plans/:date` |

## The card

**No plan yet:**

```
Daily plan                                  [ Create daily plan ]
Get a suggested order for today, based on your ToDos and calendar.

<the first five open ToDos, as ToDo rows>                View all
```

**Draft,** a numbered agenda:

```
Daily plan                                             ✦ AI draft
A suggested order for today. Edit anything, remove what doesn't fit, then save.

┌ FOCUS ──────────────────────────────────────────────────────────┐
│ [ Clear the interview notes before the customer conversation. ] │
└─────────────────────────────────────────────────────────────────┘

1   Review customer interview notes                              ✕
    ToDo · Medium · Overdue, was due Nov 9 · ● Customer research
    Why: [ The 10:00 conversation builds on these.             ]

2   10:00  Customer conversation                                 ✕
    Event · ● Customer research

3   Draft three follow-up questions                              ✕
    Suggestion · [ Add as ToDo ]
    Why: [ Both customers struggled with setup.                ]

[ Save plan ]   [ Discard ]
```

- Each item: its number; the title (an event's start time first, with "Tomorrow" before it for tomorrow's); a second line naming its kind, then the same details a ToDo row or event shows; a **Why** line when there is a note.
- In a draft, the focus and each **Why** are small text areas that grow with their text, never one-line fields that cut it off. A **Why** exists only where the model gave a reason; one cannot be added.
- While generating, the header button reads **Cancel**. The AI endpoints answer HTTP 200 with the status in the body for every outcome.
- If Save fails, the draft stays as it is with "Couldn't save the plan." and **Try again**. If a record in the draft was deleted meanwhile, Save answers 400 and the card says "Something in this plan no longer exists. Create a new draft."
- In a draft, the focus and each **Why** are editable in place, and **✕** ("Remove from plan: <title>") removes an item. After a removal, keyboard focus moves to the next item's remove button. The order cannot be changed.
- **Add as ToDo** opens the ToDo form filled in with the suggestion's title and project. A ToDo exists only if the user saves that form. The suggestion stays in the plan.

**Saved:** the same agenda, read-only, without the badge and the opening line; the button reads **Create new draft**. **Add as ToDo** still shows on suggestions.

**In the Logbook's day view** (`/logbook/day/<date>`)**:** the saved plan, read-only, without **Add as ToDo**. An item whose record was deleted shows its saved title followed by "(deleted)".

| State | The card shows |
|---|---|
| Generating | "Creating your plan…" and **Cancel** |
| Too little information | "Add a few ToDos, events, or a log entry, and I can suggest a plan." |
| Timed out, or failed | "Couldn't create a plan this time." with **Try again** |
| Limit reached | "You've reached today's AI limit. It resets tomorrow." |
| Unavailable | "AI planning is unavailable right now. Everything else still works." |

In every one of these states the open-ToDo list, or the saved plan, stays visible below the message.

## Acceptance criteria

- **PLAN-1** `[test]` With three open ToDos and two events today, a draft's ToDo and event items carry the records' own titles, times, priorities, due dates, and projects.
- **PLAN-2** `[test]` Generating stores nothing: no saved plan and no new ToDo exist afterwards.
- **PLAN-3** `[test]` A saved plan is returned by Read with its focus and items.
- **PLAN-4** `[test]` An answer that references a ToDo that was not sent, or another user's ToDo, is rejected whole.
- **PLAN-5** `[test]` With too little information the endpoint answers so, and no usage row is written.
- **PLAN-6** `[test]` A provider slower than 25 seconds gives `timed_out`.
- **PLAN-7** `[test]` After a ToDo in a saved plan is deleted, the plan shows "<title> (deleted)".
- **PLAN-8** `[test]` With the limit reached the endpoint answers `limit_reached` and the provider is not called.
- **PLAN-9** `[test]` Saving a date other than today, a plan with no items, or one that references another user's ToDo answers 400 and stores nothing. Saved titles come from the records, not the request.
- **PLAN-10** `[test]` An event note that only restates the event's time is dropped.
- **PLAN-11** `[test]` Editing the focus, editing a note, and removing an item change the draft that Save sends; a draft with no items cannot be saved.
- **PLAN-12** `[test]` Each state in the table shows its message, and the open-ToDo list or saved plan stays visible.
- **PLAN-13** `[owner]` The draft and the saved plan match the sketch, with the demo data and the real provider.
- **PLAN-14** `[owner]` The plan reads as a sensible order for the day, and suggestions are clearly labeled.
