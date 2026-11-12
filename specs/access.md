# Access: sign-in, allowlist, users

Only allowlisted accounts can use the app. Sign-in is Clerk (`@clerk/astro`); the allowlist is the app's own check and is the one that counts.

## Rules

- **Middleware** runs on every request and decides, in this order:

  | Request | Page | Endpoint (`/api/**`) |
  |---|---|---|
  | Clerk keys missing | 503, "Sign-in is not set up yet." | 503, same message as JSON |
  | Signed out | redirect to `/sign-in` | 401 |
  | Signed in, not on the allowlist | redirect to `/access-denied` | 403 |
  | Signed in, allowlisted, asking for `/sign-in` | redirect to `/` | n/a |
  | Signed in, allowlisted | allow | allow |

  `/sign-in` and `/access-denied` are always reachable. So is everything under `/_astro/`, the build's own scripts and styles, which hold nothing personal: the middleware lets those requests through, so a file that is missing answers 404 and never a redirect to the sign-in page. The decision is one plain function, so it can be tested without Clerk. It guards everything under `/api/` by its prefix, so "every endpoint" in the criteria means every endpoint that exists so far plus a path under `/api/` that does not. For the same reason the live check needs no endpoint of its own: it asks for `/api/live-check`, which does not exist, and expects 401. The 503 answer is a plain page without the app's styling, since the app cannot render at that point.
- **The allowlist** is `ALLOWED_CLERK_USER_IDS`: Clerk user IDs separated by commas, spaces trimmed. Empty or missing admits nobody.
- **The current-user helper** is the only way feature code learns who is asking. It takes the verified identity, checks the allowlist again, and returns the internal user, creating it on the first request with `INSERT ... ON CONFLICT DO NOTHING` on the Clerk user ID, then reading it back. Signed out raises "not signed in"; not allowlisted raises "not allowed" and creates nothing.
- **Name and email** come from Clerk's user record (`locals.currentUser()`), not the session token, which does not carry them. They are copied when the user is created and compared again at most once every 10 minutes; `profile_checked_at` records the last comparison. If Clerk's user record cannot be read, the request carries on: an existing user is kept as stored, and a new one is created without a name and completed at the next comparison.
- **No webhooks.** No sign-up page. An account not on the allowlist gets no user record, reads and writes nothing, and makes no AI request.

## Data

`users`: `id`, `clerk_user_id` (unique, required), `name`, `email`, `time_zone` (empty until detected; settings.md), `profile_checked_at`, `created_at`, `updated_at`.

## Screens

- **`/sign-in`:** Clerk's `<SignIn />` centered on the app's background, under the AI Sidekick wordmark. No sidebar. It uses hash routing (`routing="hash"`), so its steps stay on `/sign-in` and need no further routes. Hide Clerk's "Sign up" line. The panel's own heading and text size are Clerk's and are left as they are.
- **`/access-denied`:** "This account doesn't have access." with a **Sign out** button. No sidebar, no data. No account exists that is signed in but off the allowlist, so this page is checked by tests of its wording and of the middleware.
- **Sidebar, bottom:** a circle with the account's initials, the name beside it, a **Settings** link, and **Sign out**.

```
( AE )  Alex Example
Settings
Sign out
```

## Acceptance criteria

- **AUTH-1** `[test]` Signed out, every page redirects to `/sign-in` and every endpoint answers 401.
- **AUTH-2** `[test]` Signed in but not allowlisted, every page redirects to `/access-denied`, every endpoint answers 403, and no user record exists afterwards.
- **AUTH-3** `[test]` Twelve first requests arriving together from one allowlisted account create exactly one user record.
- **AUTH-4** `[test]` With an empty allowlist, nobody is admitted.
- **AUTH-5** `[test]` The current-user helper refuses an identity that is not allowlisted, even when called directly, and creates nothing.
- **AUTH-6** `[test]` A changed name or email is refreshed from Clerk's user record, and not more often than every 10 minutes. A row with no `profile_checked_at` is compared on its next request.
- **AUTH-7** `[test]` With no Clerk keys, pages and endpoints answer 503 with the message.
- **AUTH-8** `[owner]` Signed in, the sidebar shows the account's initials and name, and **Sign out**.
- **AUTH-9** `[owner]` After **Sign out**, the sign-in page shows.
- **AUTH-10** `[test]` Signed out, a request under `/_astro/` is let through, not redirected.
