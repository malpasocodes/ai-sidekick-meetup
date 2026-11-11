# Demo data

A small, fixed set of records for the owner's account, so the screens and the AI features have something to show. Dates are relative to "today" in the account's time zone, so the set is always current.

## Commands

- `npm run demo -- add <dev|production>` creates the set for the owner: the first ID in `ALLOWED_CLERK_USER_IDS`.
- `npm run demo -- remove <dev|production>` deletes it.

## Rules

- Every demo record has a fixed ID derived from the account, so **remove deletes exactly the records add created** and nothing else the account owns.
- A demo record stays a demo record when the owner edits it: `remove` deletes it, and `add` puts it back as listed here. Both commands say so in what they print.
- `production` is used only when the owner asks for it.
- `add` is safe to run twice.
- If the account has no time zone yet, `add` sets `America/New_York`. If it has no user row yet, `add` creates one.
- If the account already has its own project named like a demo project, `add` stops with a plain message and creates nothing.
- The logbook entries join the set in Phase 3, when their table exists.
- Run on a later day, `add` moves the demo records to that day's relative dates.

## The set

**Projects**

| Name | Description | Color |
|---|---|---|
| Customer research | Interviews, and what we learn from them | slate |
| Launchpad | Exploring the next idea | terracotta |

**ToDos**

| Title | Due | Priority | Project |
|---|---|---|---|
| Review customer interview notes | yesterday | Medium | Customer research |
| Sketch the onboarding flow | today | High | Launchpad |
| Book a room for the rehearsal | today | Low | none |
| Send the pricing survey | tomorrow | Medium | Customer research |
| List open questions for the next idea | none | Medium | Launchpad |
| Write up the three strongest interview quotes | none | Low | Customer research |

**Events**

| Title | When | Project |
|---|---|---|
| Customer conversation | today 10:00–10:45 | Customer research |
| Launchpad check-in | today 14:00–15:00 | Launchpad |
| Design review | tomorrow 09:30–10:15 | Launchpad |

**Logbook entries,** each created on its own date:

Two days ago, Customer research:

```
# Pricing survey drafted

Drafted the pricing survey. Two customers agreed to talk this week.

- Review the questions once more
- Then send it
```

Yesterday, Customer research:

```
# Two customer calls

Spoke with two customers; both struggled with the **first-run setup**.

The interview notes still need a proper read-through.
```

Yesterday, Launchpad:

```
# Onboarding sketch

Started the onboarding sketch but did not finish it.

1. Welcome screen: done
2. First-run setup: not started
```

Today, no project:

```
# Rehearsal room

Asked about a room for the rehearsal. Waiting to hear back.
```

No saved plan and no briefing: the owner creates those through the app.
