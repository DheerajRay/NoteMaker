# ADR 0002: Tone.js Over Raw Web Audio

## Decision

Use Tone.js for the MVP audio transport and synthesis layer, backed by Web Audio.

## Rationale

Raw Web Audio is powerful but verbose for musical timing. Tone.js gives a transport, BPM, loop points, synths, and schedule notation that match sequencer requirements.

## Consequences

Tone.js is isolated behind `NoteMakerAudioEngine` so future imported audio, sampling, or lower-level scheduling can evolve without rewriting UI state.
