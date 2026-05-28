# Git Workflow

## Branches

Use `codex/<short-feature-name>` for feature work. Keep `main` or `master` releasable.

## Commits

Use conventional commits:

- `docs: add product requirements`
- `feat: add sequencer timeline`
- `test: cover project serialization`
- `fix: preserve track order in schedule`

## Verification Before Commit

Run:

```bash
npm run test
npm run build
```

Commit only after both pass or after documenting the exact known failure.

## Release Tags

Use semantic tags after verified milestones, such as `v0.1.0` for the first sequencer MVP.
