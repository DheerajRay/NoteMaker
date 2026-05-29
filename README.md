# NoteMaker

NoteMaker is a local-first, browser-based pocket sequencer for creative beginners. The first release focuses on compact music-making: choose one of 16 pad sounds, place clips on a running step grid, loop playback, change tempo, and save or load a project JSON file.

## Current MVP

- Vite, React, TypeScript, Tone.js, dnd-kit, Zustand, and Vitest.
- Pocket-sampler-inspired performance deck with LCD status, 16 running step lights, 4x4 sound pads, pattern loop buttons, and punch-in FX controls.
- High-contrast operator surface with timeline grid, sequence overview, transport controls, and project import/export.
- Local-first project storage through `localStorage` plus explicit JSON export/import.
- Tested data model, sequencer expansion, deterministic audio schedule planning, and app shell rendering.

## Scripts

```bash
npm install
npm run dev
npm run test
npm run build
```

## Development Workflow

Work in feature branches prefixed with `codex/`. Keep changes test-first where possible: write a failing unit or component test, implement the smallest useful behavior, then run `npm run test` and `npm run build` before committing.

## Roadmap

The first release is intentionally sequencer-first. Sampling, audio import, trimming, waveform editing, live FX processing, recording, cloud sync, collaboration, and audio export belong to later workstation phases documented under `docs/product/PRD.md`.
