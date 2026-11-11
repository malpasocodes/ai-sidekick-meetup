# Settings and time zone

One time zone per user decides what "today" is and how times are shown, wherever the server runs.

## Rules

- **"Today"** is the current calendar date in the user's time zone. The server computes it from the stored zone and a clock that tests can fix. It never uses the server's own zone.
- **Detection.** On the first page load the browser's zone (an IANA name such as `America/New_York`) is sent to the server, which saves it only while none is saved. A later detection never overwrites the setting.
- Until a zone is saved, the server uses `UTC`, and the page reloads once after the first detection so that the first page the user reads is already in their zone.
- A **valid zone** is one the runtime's `Intl` accepts. The select lists `Intl.supportedValuesOf('timeZone')` plus `UTC`.
- **Changing it** in Settings saves at once and applies to every page opened afterwards. Stored instants and stored calendar dates do not change; only how instants are shown and which date counts as today.

## Data

`users.time_zone`: IANA name; empty until detected.

## Operations

| Operation | Endpoint | Notes |
|---|---|---|
| Read | `GET /api/settings` | `{ timeZone }` |
| Save detected zone | `POST /api/settings/detected-time-zone` | `{ timeZone }`; saved only if none is saved |
| Change | `PUT /api/settings` | `{ timeZone }`; must be a valid IANA name |

## Screen

```
Settings

Time zone
[ America/New_York            ▾ ]     Saved
Times and "today" follow this time zone.
```

A standard select of IANA zones, showing `UTC` until a zone is saved. After a change the status beside it reads "Saving…", then "Saved", or "Couldn't save" with **Try again**.

## Acceptance criteria

- **SET-1** `[test]` A first detection of `Asia/Tokyo` is saved and returned by Read.
- **SET-2** `[test]` After changing the zone to `America/Los_Angeles`, "today" and the dates and times events are listed under follow it.
- **SET-3** `[test]` With the zone `Pacific/Auckland`, a fixed clock at 08:00 Auckland time, and the server in UTC, "today" is the Auckland date.
- **SET-4** `[test]` An invalid zone name answers 400 and changes nothing.
- **SET-5** `[test]` Once a zone is saved, a detection request with a different zone changes nothing.
- **SET-6** `[owner]` The Settings page shows the current zone in the select.
