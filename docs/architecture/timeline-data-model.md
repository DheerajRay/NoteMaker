# Timeline Data Model

## Project

`Project` is the root JSON document. It contains version, metadata, tempo, total steps, loop range, tracks, and clips. The current file version is `notemaker.project.v1`.

## Tracks

`InstrumentTrack` represents a visible lane. Each track has an instrument preset, volume, pan, mute, and solo state. The current UI exposes mute and solo; volume and pan are reserved in the schema for the mixer phase.

## Clips

`PatternClip` represents a reusable pattern placed on one track. It has `startStep`, `lengthSteps`, `repeat`, and a list of step-relative events. Repeating clips expand at schedule time rather than duplicating stored events.

## Events

`StepEvent` stores step-relative sound triggers: sound name/note, velocity, duration, and optional probability. Probability is reserved for future playful variation and is not active in v1 scheduling.

## Persistence

Projects are saved in `localStorage` for immediate recovery and can be exported as formatted JSON. Import validates the project version and required track/clip arrays before replacing the current project.
