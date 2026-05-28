# ADR 0001: Vite React TypeScript

## Decision

Use Vite, React, and TypeScript for the first NoteMaker app.

## Rationale

The product is a client-heavy creative tool with browser audio, drag/drop, and fast iteration needs. Vite keeps the local development loop short, React fits the componentized workspace, and TypeScript protects the project schema and scheduler boundaries.

## Consequences

The MVP is a static client app. Backend work can be added later without changing the core project model.
