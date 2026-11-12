# Morning Briefing

On request, a short summary of today in the banner on the Today screen. The app lists the facts from the user's records; the model writes only two sentences. Read-only, today only, never generated automatically.

## Who writes what

| Part | Written by | Content |
|---|---|---|
| Headline | Model | One sentence on the shape of the day: how much is scheduled, how much is due or overdue, what most needs attention |
| Schedule | App | Today's events, by start time |
| Due | App | Open ToDos that are overdue or due today, in list order |
| From your log | Model | One sentence on what the recent logbook entries leave unfinished. Optional |

The model never writes a list, so it cannot invent an event or a ToDo. It proposes no new work; that is the Daily Plan's job.

## What the model is sent

- Today's date and the time zone.
- Today's events: title, time, project name.
- Open ToDos overdue or due today: title, due date, priority, project name.
- Logbook entries dated today or the two dates before it, newest first, up to 5: date, project name, and the first 2,000 characters of the body.

**Too little information:** none of the above exists. The model is not called.

## What the model returns

```
headline: text, 1–160 characters
carriedOver?: text, up to 200 characters
```

The instructions ask for a headline that counts overdue ToDos and ToDos due today separately. An overdue ToDo is not "due today": a real answer described one overdue and two due today as "3 ToDos due today".

## Server checks

- **Invented times reject the answer.** If either sentence contains a clock time (such as "10:00", "9am", or "2 pm") that appears nowhere in what was sent, the answer is rejected (`failed`) and nothing is stored. A time counts as sent when it matches an event's start or end time in either 24-hour or 12-hour form ("2:00" and "2pm" both match 14:00), or appears in an entry that was sent. Words such as "noon" are not checked.
- `carriedOver` is dropped when no entry was sent.
- A valid answer is stored as today's briefing, replacing any earlier one, together with the two lists as they are at that moment.

## Data

`briefings`: `id`, `user_id`, `briefing_date` (unique per user), `headline`, `carried_over`, `facts` (JSON: `events` as `{ time, title }`, `due` as `{ title, when, overdue, highPriority }`, and `moreEvents` and `moreDue` counts), `generated_at`.

Read answers 200 with `{ briefing: null }` when there is none today.

## Operations

| Operation | Endpoint |
|---|---|
| Read today's | `GET /api/briefing/today` |
| Create or refresh | `POST /api/ai/briefing` |

## The banner

**None yet today:**

```
✦ MORNING BRIEFING │ Get a quick summary of your day.        │ [ Create briefing ]
```

**Briefing:**

```
✦ MORNING BRIEFING │ Two meetings today, and an overdue ToDo to clear first.  │ ↻ Refresh briefing
                   │                                                          │
                   │ SCHEDULE       10:00  Customer conversation              │
                   │                14:00  Launchpad check-in                 │
                   │ DUE            Review customer interview notes           │
                   │                  (overdue, was due Nov 9)                │
                   │                Sketch the onboarding flow                │
                   │                  (today, high priority)                  │
                   │ FROM YOUR LOG  The onboarding sketch is still unfinished.│
                   │                                                          │
                   │ Updated at 08:12                                         │
```

- Sage-soft background. The label and sparkle on the left, the content in the middle, one button on the right; at phone width they stack in that order.
- The headline is the largest text. The three group labels are small capitals in a left column, their content to the right.
- Each list shows at most 8 rows, then "and N more".
- With no events: "No events today". With nothing due: "Nothing due today". **From your log** shows only when there is a sentence.
- A due ToDo is followed by "(today)" or "(overdue, was due Nov 9)", with ", high priority" added inside the brackets when it applies. Overdue is in the destructive color.
- From 1024 pixels wide the button sits in the banner's top right corner, beside the headline, so the lists below use the full width.
- From 1024 pixels wide the group labels sit in a left column beside their content; below that each label sits above its content. A due ToDo and its bracketed note stay on one line where they fit.
- In the Limit reached, Unavailable, and Too little information states the button keeps its **Create briefing** or **Refresh briefing** label.
- The banner's accessible name, in every state, is "AI-generated morning briefing". The sparkle and the label are the only AI marking it needs.
- The same button changes its label (**Create briefing**, **Cancel**, **Refresh briefing**, **Try again**), so keyboard focus stays put.
- The stored briefing is shown on later visits the same day. The next day the banner is back to "none yet today".

| State | The banner shows |
|---|---|
| Generating | "Creating your briefing…" or, over an existing one, "Refreshing your briefing…"; the button reads **Cancel** |
| Too little information | "Nothing scheduled or due today. Add an event or ToDo, or write a log entry." |
| Timed out, or failed | "Couldn't create a briefing this time."; the button reads **Try again** |
| Limit reached | "You've reached today's AI limit. It resets tomorrow." |
| Unavailable | "Briefings are unavailable right now." |

In every one of these states an existing briefing stays visible, with the message below it.

## Acceptance criteria

- **BRF-1** `[test]` With two events today and one overdue ToDo, the stored briefing's lists hold exactly those records, the ToDo marked overdue.
- **BRF-2** `[test]` Reading today's briefing returns the stored one and writes no usage row.
- **BRF-3** `[test]` A refresh replaces the stored briefing and its time.
- **BRF-4** `[test]` When a refresh fails, the earlier briefing is still stored and still shown, with the message.
- **BRF-5** `[test]` With a fixed clock on the next day, Read returns no briefing.
- **BRF-6** `[test]` With too little information the endpoint answers so and writes no usage row. An entry from today alone is enough; one older than two dates back is not.
- **BRF-7** `[test]` A provider slower than 15 seconds gives `timed_out`.
- **BRF-8** `[test]` An empty headline, or one over 160 characters, is rejected and does not replace an earlier briefing.
- **BRF-9** `[test]` A headline with a clock time found in nothing that was sent is rejected and nothing is stored; a time that was sent is accepted.
- **BRF-10** `[test]` With the limit reached the endpoint answers `limit_reached`, the provider is not called, and an earlier briefing stays.
- **BRF-11** `[test]` With no events the Schedule reads "No events today"; a list of ten shows eight rows and "and 2 more".
- **BRF-12** `[test]` `carriedOver` is dropped when no entry was sent.
- **BRF-13** `[owner]` The banner matches the sketch, with the demo data and the real provider.
- **BRF-14** `[owner]` The two sentences say nothing the demo data does not support.
