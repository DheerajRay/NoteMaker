# ADR 0003: Local-First MVP

## Decision

Store projects locally and support explicit JSON export/import in v1.

## Rationale

The core risk is whether the sequencer feels good. Cloud sync would introduce authentication, quotas, privacy, and backend failure modes before the creative loop is proven.

## Consequences

Users can lose browser-local data if they clear site storage. Export/import provides a portable backup path until cloud persistence is intentionally designed.
