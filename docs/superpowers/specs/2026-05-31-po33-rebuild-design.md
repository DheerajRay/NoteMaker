# PO-33-Style NoteMaker Rebuild Design

## Purpose

Rebuild NoteMaker from the current children/storybook/minimap-adjacent arranger direction into a browser-based sampler and step sequencer that recreates the PO-33 K.O!-style operating model. The product should feel like a compact digital instrument: one device surface, 16 sound slots, 16-step patterns, sample import, sample trimming, live write mode, punch-in effects, visible LEDs, and simple persistence.

This rebuild recreates the workflow, not Teenage Engineering's protected identity. NoteMaker will use original UI artwork, original copy, original starter sounds, and its own project format while matching the core mental model documented in the official PO-33 guide: 16 sound slots, melodic and drum behavior, 16-step patterns, pattern chaining, tone/filter/trim controls, live recording, parameter locking, and punch-in effects.

References:

- Official PO-33 guide: https://teenage.engineering/guides/po-33/en
- Official PO-33 sound pack transfer flow: https://teenage.engineering/downloads/po-33
- Official PO-33 product page: https://teenage.engineering/store/po-33

## Product Persona

The primary user is a teen beatmaker who wants the immediacy of a small hardware sampler in the browser. They want to pick sounds, import samples, tap steps, hear loops immediately, and understand what the instrument is doing by watching the display and LEDs. They are not looking for a full DAW, a children's music toy, a storybook interface, a map-like composition surface, or a generic clip timeline.

The core job is: "Let me load or pick sounds, punch a 16-step beat, trim and tweak samples, chain patterns, and understand what the machine is doing."

## Scope Reset

### Remove From Product Direction

- Children-book visual themes.
- Mini-map composition concepts.
- Decorative illustrated arranger workflows.
- The generic track-and-clip timeline as the primary creation surface.
- Current built-in instrument lane model as the public mental model.
- UI promises that imply finished sampling or FX behavior before the audio engine supports them.

### Keep As Engineering Assets Where Useful

- Vite, React, TypeScript, Tone.js, Zustand, Vitest, and existing test setup.
- Existing browser-local persistence concepts.
- Existing audio scheduling lessons, but not the current track/clip schema.
- Existing accessibility baseline: keyboard-focusable controls, labels, visible focus, and reduced-motion support.

## Product Principles

1. **Device-first UI:** the first screen is the instrument, not a landing page or DAW.
2. **Slot-first sound model:** 16 sound slots are the center of the app.
3. **Pattern-first sequencing:** 16-step patterns are the default unit of music.
4. **Browser-native sampling:** file import ships first; microphone recording follows once permission and feedback states are solid.
5. **Original starter pack:** ship royalty-safe, original "PO-33-like" sounds that teach the workflow without copying TE audio.
6. **Visible machine state:** display, LEDs, selected mode, selected sound, selected pattern, write state, and memory state must be obvious.
7. **Small-device constraints with escape hatches:** mirror the PO-33 operating model, but use browser affordances for import, save, and precise editing where they reduce friction.

## MVP Behavior

### Sound Slots

- The project contains 16 sound slots.
- Slots 1-8 are melodic slots: each pad triggers the selected sample pitched across the 16 keys.
- Slots 9-16 are drum slots: each slot contains a sample that can be sliced across 16 keys.
- Each slot stores sample metadata, trim start, trim length, gain, pitch, filter value, resonance value, and whether it is empty.
- Empty slots show clear visual feedback and can receive an imported sound.
- The starter project loads original sounds into all 16 slots.

### Patterns

- The project contains 16 patterns.
- Each pattern contains 16 steps.
- Steps store note triggers by sound slot and key index.
- Write mode toggles whether pressing steps edits the active pattern.
- Pressing a lit step in write mode removes that trigger.
- The app shows active steps as stable LEDs and highlights the current playhead step.
- Pattern selection follows the "pattern + key" mental model, adapted to direct browser controls.

### Playback

- Playback loops the active 16-step pattern by default.
- Tempo supports 60-240 BPM.
- The display shows BPM, active pattern, active sound slot, current step, write mode, and memory status.
- The audio engine schedules sample playback from the pattern data rather than synthesizing temporary test tones.
- Muted or empty slots never schedule audio.

### Import And Starter Sounds

- Users can import an audio file into a selected sound slot.
- Supported input formats depend on browser decoding support through Web Audio.
- Import replaces the selected slot's audio and metadata.
- The app ships an original starter pack with short drums, one-shots, bass notes, chords, and texture sounds.
- No Teenage Engineering factory sounds, trademarks in UI labels, mascot artwork, official screen graphics, or copied product layout are bundled.

### Trimming And Parameters

- Trim mode maps knob A to sample start and knob B to sample length.
- Tone mode maps knob A to pitch and knob B to volume.
- Filter mode maps knob A to filter cutoff and knob B to resonance.
- Drum slots can store slice-level trim adjustments for the last selected slice.
- Melodic slots apply trim and parameters to the whole sample.

### Punch-In FX

- The MVP includes 16 FX buttons, with the same broad categories as the PO-33 guide: loops, unison/octave shifts, stutters, scratch-like motion, quantize feel, retrigger, reverse, and no effect.
- Initial implementation may make FX state visible before every effect has full audio parity.
- Each implemented FX must have a clear audible behavior, visible active state, and deterministic state in tests.
- Saved FX automation belongs to write mode and pattern data.

### Pattern Chaining

- Users can build a chain from patterns 1-16.
- Chains can repeat the same pattern multiple times.
- Playback advances through the chain and loops back to the beginning.
- Chaining may ship after single-pattern playback if implementation risk is high, but the data model must allow it from the start.

### Persistence

- Replace the existing project format with `notemaker.po33.v1`.
- Projects persist to `localStorage`.
- Users can export and import `.notemaker.json` files.
- Imported legacy `notemaker.project.v1` files are unsupported in the rebuild unless a migration is explicitly added in a future compatibility phase.

## Architecture

### Domain Model

Create a new PO-33-style project model:

- `Project`: title, version, tempo, active pattern, active sound slot, write mode, memory summary, slots, patterns, chain.
- `SoundSlot`: id 1-16, type `melodic` or `drum`, name, sample id, trim, gain, pitch, filter, resonance, slice settings.
- `SampleAsset`: id, name, source type, object URL or bundled URL, decoded metadata, duration seconds.
- `Pattern`: id 1-16, steps.
- `PatternStep`: step index 1-16, triggers, locked params, saved FX.
- `StepTrigger`: slot id, key index, velocity, probability.
- `PatternChain`: ordered pattern ids.

### State Management

Use Zustand for session state:

- active mode: sound, pattern, write, record/import, FX, parameter mode.
- selected sound slot.
- selected pattern.
- selected key or slice.
- transport state.
- import progress and decode errors.
- project mutations with local persistence.

### Audio Engine

Replace current synth-based scheduling with a sample engine:

- Decode bundled and imported samples through Web Audio/Tone.js.
- Maintain sample buffers by slot id.
- Schedule pattern steps against Tone.Transport or Web Audio timing.
- Apply trim, pitch, gain, filter, and FX at playback time.
- Expose deterministic schedule planning for tests without requiring audio output.
- Separate "plan the events" from "play the events" so unit tests can validate behavior.

### UI Composition

The app shell should be a single instrument surface:

- LCD/status display.
- 16 step LEDs.
- 16 pressure-pad style keys.
- Sound, pattern, write, record/import, FX, play/stop, tempo, and utility controls.
- Two knob controls labeled A and B whose meaning changes by parameter mode.
- Slot detail panel for import, trim preview, sample duration, and clear/copy operations.
- Optional pattern chain strip after basic pattern editing works.

The old timeline can be removed from the MVP UI. If a larger arranger returns in a future release, it should be secondary to the device workflow.

## Error Handling

- Import decode failure shows a direct message and leaves the existing slot unchanged.
- Oversized audio warns that the slot may be trimmed or rejected depending on memory rules.
- Empty slot playback is silent but visibly shows no sample.
- Browser audio permission/start failures show an actionable "tap play again" style state.
- Corrupt project import is rejected with a version-aware error.

## Testing

Unit tests:

- default project creation creates 16 slots and 16 patterns.
- slots 1-8 are melodic and 9-16 are drum.
- pattern step toggling adds and removes triggers.
- write mode controls whether pad/step actions mutate pattern data.
- schedule planning skips empty slots and respects active pattern/chain.
- trim and parameter mapping produce expected playback values.
- project serialization round-trips.

Component tests:

- app renders the new device surface.
- selecting a sound slot updates the display.
- write mode lets a user place and remove a step.
- importing a valid audio file updates a slot state through a mocked decoder.
- legacy timeline labels are absent.

Verification:

- `npm run test`
- `npm run build`
- browser smoke test after implementation to confirm nonblank UI, no console errors, and visible interaction states.

## Build Slices

1. **Documentation and schema reset:** update product docs and domain types for `notemaker.po33.v1`.
2. **Project/store foundation:** create default 16-slot, 16-pattern project and persistence.
3. **Device shell UI:** replace the current app UI with LCD, LEDs, keys, mode controls, knobs, and transport.
4. **Pattern editing:** implement selected sound, selected pattern, write mode, and step toggling.
5. **Sample assets:** add original starter pack metadata and sample loading path.
6. **Sample playback:** replace synth scheduling with sample-slot scheduling.
7. **Import workflow:** decode user files into selected slots and persist metadata.
8. **Trim and parameters:** wire knob modes to sample playback settings.
9. **FX and chain:** add punch-in FX state, initial audible FX, and pattern chain playback.
10. **Polish and verification:** responsive layout, accessibility pass, tests, build, and smoke check.

## Acceptance Criteria

- The first screen is a PO-33-style browser instrument, not the old timeline app.
- A starter project contains 16 original sounds across melodic and drum slots.
- A user can select a sound slot, enter write mode, toggle steps, press play, and hear/see the pattern loop.
- A user can import an audio file into a selected slot and use it in the pattern.
- A user can trim a sample and hear the changed playback region.
- A user can switch patterns and preserve different step data per pattern.
- A user can export/import the new project format.
- Old children/storybook/minimap design concepts and old arranger-first UI are absent.
- `npm run test` and `npm run build` pass.
