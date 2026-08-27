## Context

The generated Platform contract already defines URL submission, operation
snapshots, a resumable SSE stream, and a bounded operation list. Web's pinned
copy predates the list route. The public capture body has only `url`; text
capture must not be guessed.

## Goals / Non-Goals

**Goals:**

- Keep one URL submission idempotent across transport retries.
- Render operation data directly from typed snapshots and retain terminal
  states through stream failure.
- Use the Platform list endpoint for recent captures without browser-side
  unbounded fetching.

**Non-Goals:**

- Paste-text capture, duplicate search/pre-check, a separate link-only save,
  server-persisted favorite or read mutations, and batch/filter/keyboard
  library controls.
- Any direct connection to a worker, database, or event bus.

## Decisions

### Refresh the pinned OpenAPI artifact

The web API pin will move to the existing Platform document, then its generated
types will be regenerated. This is a contract-consumer update, not a new
contract. It makes the bounded operation list legal to call.

### Use authenticated fetch-stream SSE

The gateway owns the bearer credential, while browser `EventSource` cannot set
that header. A small stream adapter will issue the typed Edge request with the
gateway credential and parse persisted SSE frames. A clean close reads the
operation once; a failed stream visibly switches to polling until the terminal
snapshot arrives. This keeps recovery on the same authorized boundary without
putting a credential in a URL. A resumable reconnect using `Last-Event-ID`
remains a follow-up because polling already preserves the terminal result and
the gateway has no reconnect policy yet.

### Project snapshots monotonically

The tracker owns one reducer. Terminal states never regress; an event with an
older sequence or a weaker snapshot cannot replace a later/terminal one. Poll
answers and stream frames enter that same reducer, so a stream drop cannot
produce duplicate terminal navigation.

### Treat stages as display data

Status controls terminal/retry/navigation logic. The stage string is rendered
verbatim as a producer-defined label, so legacy names such as Extracting or
Summarizing work when supplied but no local pipeline vocabulary becomes a
contract.

### Keep library presentation state local

The recent list is a projection of `content.capture.submit` operations. Read
and favorite toggles use scoped local presentation state and state their local
nature; inventing mutations would make an archive change appear durable.

## Risks / Trade-offs

- [Stream parser errors or proxy disconnects] → close the stream, announce
  polling, and retain the latest safe snapshot until a terminal read succeeds.
- [A result reference is not reader-compatible] → show the terminal result
  reference rather than navigating to an invented route.
- [Degraded extraction lacks a dedicated link-only mode] → retain the server's
  warning and offer the actual result reference; a distinct link-only save
  requires a future capture-contract addition.
- [OpenAPI pin changes beyond operations] → review the generated diff and run
  the contract drift gate before feature tests.
- [Local preference state disappears outside browser storage] → label it as
  presentation only and retain server persistence as a follow-up.

## Migration Plan

1. Update the generated contract pin and types from the existing Platform
   document.
2. Ship the new routes behind `content.submit`; deployments without it keep the
   existing explained capability absence.
3. Roll back by removing the client routes; accepted operations remain owned
   and readable by Platform.
