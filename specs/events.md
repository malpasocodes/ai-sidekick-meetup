# Events

Scheduled commitments with a start time. No all-day or recurring events, no reminders, no outside calendars.

## Data

`events`:

| Field | Rules |
|---|---|
| `id`, `user_id` | Owner required |
| `title` | 1–200 characters, trimmed |
| `starts_at` | Required instant (UTC) |
| `ends_at` | Optional instant; after `starts_at`, and at most 24 hours after it |
| `project_id` | Optional; one of the user's projects; emptied if the project is deleted |
| `notes` | 0–2,000 characters |
| `created_at`, `updated_at` | |

## Rules

- Times are entered and shown in the user's time zone. The form turns its date and times of day into instants before sending; the server stores instants and returns each event with its instants and with its date and times in the user's zone.
- A new event's date starts as today, or as the Monday of the week being viewed when that is not this week. Its times start empty. End may be left empty.
- **End time** in the form is a time of day. Earlier than the start means the event ends the next day, and the form says "Ends next day". Equal to the start is rejected.
- An event belongs to the day it starts, even when it runs past midnight.
- **Ended:** the end time has passed or, with no end time, the start time has passed, worked out each time the list is loaded. Only Today's calendar card dims ended events; the Calendar page does not.
- A `project_id` that is another user's, or does not exist, answers the same 400.

## Operations

| Operation | Endpoint |
|---|---|
| List a range | `GET /api/events?from=<date>&to=<date>` (both dates included, in the user's time zone; at most 62 days, otherwise 400): the events, `today`, and the user's time zone, which the pages need to mark today's row |
| Create | `POST /api/events` |
| Update | `PATCH /api/events/:id` |
| Delete | `DELETE /api/events/:id` |

## Screens

**Today's calendar card:** today's events by start time. Ended events are dimmed: the muted text color at full size, with "(ended)" added for screen readers.

```
Today's calendar                                   [ + Event ]

10:00   ● Customer conversation
14:00   ● Launchpad check-in
```

The dot is the project's color, or neutral with no project. Empty: "No events today." with **+ Event**.

**Calendar page:** one week, Monday to Sunday, as a list of days.

```
Calendar           [ ‹ ]  Nov 9 – 15  [ › ]  [ This week ]    [ New event ]

Mon, Nov 9      Nothing scheduled.
Tue, Nov 10     10:00–10:45   ● Customer conversation
                14:00–15:00   ● Launchpad check-in
Wed, Nov 11     09:30–10:15   ● Design review
...
```

Today's row is marked. A row opens the form in a dialog, with **Delete** inside it. An event that ends the next day shows its times as they are, `23:00–01:00`, with "next day" added for screen readers.

**Form:**

```
Title      [                                   ]
Date       [ date ]   Start [ 14:00 ]   End [ 15:00 ]
Project    [ None ▾ ]
Notes      [                                   ]
                               [ Cancel ] [ Save ]
```

## Acceptance criteria

- **EVT-1** `[test]` An event created for today at 14:00 is returned in today's range, and appears on the Today card and the Calendar page.
- **EVT-2** `[test]` Events at 10:00 and 14:00 are listed in that order whatever order they were created in.
- **EVT-3** `[test]` From the form, an end earlier than the start is saved as the next day, and an end equal to the start is rejected. Sent directly, an end not after the start, or more than 24 hours after it, answers 400.
- **EVT-4** `[test]` In `America/New_York`, an event at 23:30 is listed on that date. After a change to `Europe/London` it is listed on the next date at 04:30 (use a January date).
- **EVT-5** `[test]` The week containing a given date runs Monday to Sunday, and previous and next move by seven days.
- **EVT-6** `[test]` Updating or deleting another user's event answers 404, and a range never includes it.
- **EVT-7** `[test]` Another user's project, or a missing one, as `project_id` answers the same 400.
- **EVT-8** `[test]` With a fixed clock, an event whose end has passed (or, with no end, whose start has passed) is marked ended; a later one is not.
- **EVT-9** `[owner]` The Today card and the Calendar page show the demo events with their times and project dots.
- **EVT-10** `[owner]` The form can be filled in and saved with the keyboard alone.
