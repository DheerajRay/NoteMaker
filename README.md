# NoteMaker

NoteMaker is a local-first, browser-based sampler and step sequencer inspired by the PO-33 operating model. The app now focuses on a single hardware-like surface: 16 sound slots, 16-step patterns, write mode, pattern selection, parameter knobs, starter sounds, audio-file import, and JSON project save/load.

## Current MVP

- Vite, React, TypeScript, Tone.js, Zustand, and Vitest.
- PO33-style project format: `notemaker.po33.v1`.
- 16 sound slots with original starter sound metadata.
- Slots 1-8 behave as melodic slots; slots 9-16 behave as drum slots.
- 16 patterns with 16 steps each.
- Write mode toggles step triggers for the selected slot and key.
- LCD, step LEDs, slot pads, key bank, pattern bank, transport, tempo, and parameter controls.
- Local-first persistence through `localStorage` plus explicit JSON export/import.

## Scripts

```bash
npm install
npm run dev
npm run test
npm run build
```

## Development Workflow

Work in feature branches prefixed with `codex/`. Keep behavior test-first: write the failing unit or component test, implement the smallest useful behavior, then run `npm run test` and `npm run build` before committing.

## Product Boundaries

NoteMaker recreates the compact sampler workflow, not Teenage Engineering's protected identity. The app ships original starter sound metadata and original UI artwork. It does not bundle PO-33 factory audio, official graphics, trademarks in UI labels, mascot artwork, or copied product layouts.
