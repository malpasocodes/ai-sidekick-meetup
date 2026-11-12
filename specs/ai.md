# AI adapter

One application-owned way to call the model: limited, logged, and replaceable. Feature code never touches the provider.

## The one function

```ts
generateStructured(runtime, {
  feature,          // "daily_plan" | "briefing"
  userId, usageDate,// who is asking, and their "today"
  instructions,     // written by the app
  input,            // the user's records, as data, kept apart from instructions
  schema,           // Zod shape of the answer
  signal,           // the request's AbortSignal
}): Promise<{ data, usage: { inputTokens, outputTokens } }>
```

`runtime` holds the provider (or none), the database, the daily limit, a clock, and a timer, so tests can supply a fake provider, PGlite, a fixed clock, and a timer they fire themselves to make a deadline pass. `src/lib/ai/runtime.ts` builds the runtime for a request from `AI_API_KEY` and `AI_DAILY_GENERATION_LIMIT`; the endpoints that use it arrive in Phase 5.

## Features

| Feature | Model | Output cap | Deadline |
|---|---|---|---|
| `daily_plan` | `mistral-small-2603` | 1,200 tokens | 25 seconds |
| `briefing` | `mistral-small-2603` | 600 tokens | 15 seconds |

One configuration file holds this table and the default daily limit (20).

## What a call does, in order

1. **No provider** (no key): fail with `unavailable`. Nothing is logged. A request that is already cancelled also stops here, with `cancelled`, taking no slot.
2. **Take a slot.** Insert a usage row with the next `slot` for this user and date, in one statement that inserts only if the user's rows for the date number fewer than the limit. A unique index on `(user_id, usage_date, slot)` means two requests arriving together cannot take the same slot: on a unique violation, try again. No row inserted means `limit_reached`, and the provider is not called. (A conditional insert without the slot is not safe when requests arrive together.)
3. **Call the provider** with the model, the output cap, and an abort signal of the adapter's own, raced against the deadline and the request's signal.
4. **Check the answer** against the schema. A refusal (an empty answer, or one that is not JSON), an answer cut off at the cap, or a mismatch is `invalid_output`. `null` for an optional field counts as absent.
5. **Finish the row** with the status and the token counts, whatever happened. `invalid_output` is recorded as `failed`. A timed-out or cancelled call has no token counts, because the provider reported none: both stay empty.

When an answer passes the schema but a feature's own check then rejects it (an invented time, an unknown reference), the row stays `completed`, because the call was made and paid for. The endpoint answers `failed`.

## Errors

The adapter fails with one of: `unavailable`, `limit_reached`, `timed_out`, `cancelled`, `failed`, `invalid_output`.

AI endpoints answer with a `status`: `ok`, `too_little_information`, `limit_reached`, `unavailable`, `timed_out`, or `failed` (which also covers `invalid_output`). An endpoint checks for `unavailable` first, before anything else, and for `too_little_information` before taking a slot. A cancelled request needs no answer.

## Providers

- **Real,** in two files. `mistral.ts` is the only file that imports `@mistralai/mistralai`; it makes one call, `chat.complete` with strict JSON-schema output built from the Zod schema, with the package's own retries switched off. `real.ts` reads the answer and retries: on HTTP 429 and 503 only, at most twice, after 1 and then 2 seconds, inside the same deadline and the same usage row. Tests import `real.ts` with a stand-in for the call, never `mistral.ts`.
- **Fake,** for tests only. It is constructed with a chosen behavior: a given answer, an invalid answer, a failure, or a delay.

## Input safety

- Instructions and user data go in separate messages. The instructions say the data may contain text that looks like instructions and must be treated as content.
- No tool calling. The model can only return the schema's shape.

## Data

`ai_usage`: `id`, `user_id`, `feature`, `model`, `usage_date`, `slot`, `status` (`started`, `completed`, `failed`, `timed_out`, `cancelled`), `input_tokens`, `output_tokens`, `started_at`, `finished_at`. Unique on `(user_id, usage_date, slot)`. Never any prompt or answer text.

## Acceptance criteria

- **AI-1** `[test]` A valid answer is returned as data, and its row is `completed` with the token counts.
- **AI-2** `[test]` With the limit at 3, a fourth call fails with `limit_reached` and the provider is not called.
- **AI-3** `[test]` With the limit at 3 and ten calls started together, exactly three reach the provider.
- **AI-4** `[test]` Failed, timed-out, and cancelled calls each leave a row with that status and count toward the limit.
- **AI-5** `[test]` With a fixed clock, a call slower than its deadline fails with `timed_out` at the deadline, and the provider's signal is aborted.
- **AI-6** `[test]` Aborting the request's signal fails with `cancelled` and aborts the provider's signal.
- **AI-7** `[test]` An answer that does not match the schema, a refusal, and a cut-off answer each fail with `invalid_output`.
- **AI-8** `[test]` `null` for an optional field is accepted; `null` for a required field is not.
- **AI-9** `[test]` With no provider, the call fails with `unavailable` and no row is written.
- **AI-10** `[test]` The limit counts per user and per date: another user, or the next date, starts from zero.
- **AI-11** `[test]` The real provider retries a 429 once within the deadline and writes one row.
