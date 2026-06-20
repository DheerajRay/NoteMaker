# Audio Engine Release Blockers Design

**Date:** 2026-06-20

## Objective

Create a reliable sample-first audio foundation for NoteMaker before its first Vercel deployment. The release must provide 16 distinct original starter samples, persistent single-device sample imports, audible parameter controls, coherent tuning, reliable layering, conventional 16-step timing, and browser smoke coverage that matches the current interface.

## Product Scope

This release preserves the existing PO-33-inspired interaction model: 16 sound slots, 16 performance keys, 16 steps, 16 patterns, write mode, Beat Flow, tempo categories, project import/export, and local-first persistence.

The release does not add accounts, cloud storage, project sharing, portable imported-audio exports, collaboration, pattern chaining, punch-in effects, waveform editing, or selectable musical scales. Project JSON remains settings-only. Imported audio is available on the browser and device where it was added.

## Starter Sound Palette

All starter slots use bundled original audio assets. No starter slot falls back to the current generic real-time synthesizer presets.

| Slot | Name | Character | Root / Behavior |
| --- | --- | --- | --- |
| 01 | Mono Bass | Warm, short sub-bass | Tuned to C2 |
| 02 | Glass Chord | Bright minor chord | Tuned to C4 |
| 03 | Dust Lead | Textured monophonic lead | Tuned to C4 |
| 04 | Square Pluck | Short digital pluck | Tuned to C4 |
| 05 | Tape Organ | Sustained, slightly unstable tone | Tuned to C4 |
| 06 | Soft Vox | Breathy vowel tone | Tuned to C4 |
| 07 | Arcade Note | Crisp lo-fi digital tone | Tuned to C5 |
| 08 | Warm Stab | Compact analog-style chord | Tuned to C4 |
| 09 | Kick | Rounded low transient | One-shot |
| 10 | Snare | Body plus controlled noise | One-shot |
| 11 | Closed Hat | Short metallic tick | One-shot; chokes slot 12 |
| 12 | Open Hat | Longer metallic wash | One-shot; choked by slot 11 |
| 13 | Clap | Layered short clap | One-shot |
| 14 | Rim | Tight pitched rim | One-shot |
| 15 | Perc | Tonal auxiliary percussion | One-shot |
| 16 | Texture | Short noisy accent | One-shot |

Assets are rendered as compact browser-compatible audio files with normalized perceived loudness and conservative peak levels. Each melodic asset declares a root MIDI note so pitch transposition is deterministic.

## Musical Model

The 16 performance keys use a fixed C minor pentatonic note map for the first release:

`C2, Eb2, F2, G2, Bb2, C3, Eb3, F3, G3, Bb3, C4, Eb4, F4, G4, Bb4, C5`

Melodic playback rate is derived from the difference between the selected performance-key MIDI note and the sample root MIDI note, plus the slot pitch control in semitones. Drum slots remain one-shots; their performance keys can retain the current slice-selection model, but a slot without a sliced imported sample plays its full one-shot consistently on every key.

A 16-step pattern represents one 4/4 bar. Each step is a sixteenth note. Tone transport notation therefore advances as `0:0:0`, `0:0:1`, `0:0:2`, `0:0:3`, `0:1:0`, and so on through `0:3:3`. The visual playhead and audio transport use the same sixteenth-note duration.

## Audio Architecture

### Asset Registry

A starter asset registry owns bundled asset URLs and sound metadata: slot ID, display name, type, duration, root MIDI note when melodic, gain compensation, and optional choke group. Project state references stable asset IDs rather than transient object URLs.

### Imported Asset Store

Imported files are validated and decoded before assignment. The encoded file bytes and metadata are stored in IndexedDB under a stable asset ID. Project state stores only that ID and descriptive metadata. On reload, the engine resolves the ID from IndexedDB, decodes the buffer, and restores playback.

Object URLs may be created temporarily for decoding, but they are never persisted. Missing or undecodable imported assets produce a visible slot-level or global error and remain silent; they do not silently substitute a starter sound.

### Sample Voices

Each trigger creates or borrows an independent sample voice so simultaneous events share the same scheduled start time and do not cut one another off. A voice applies:

1. Trim start offset and playable duration.
2. Playback rate from root tuning, selected key, and slot pitch.
3. Per-voice gain from slot gain and trigger velocity.
4. A filter with cutoff and resonance derived from slot controls.
5. A short de-click envelope at sample start and end.

Finished voices disconnect and return to the pool. Voice limits are bounded per slot, with oldest-voice stealing only after the configured limit is reached. Hat choke behavior stops active open-hat voices with a short release when a closed hat triggers.

### Mix Routing

Melodic and drum voices feed separate buses. Each bus provides conservative gain staging and gentle dynamics control. Both buses feed a master chain containing a meter and brick-wall limiter before the destination.

Starter gain compensation is set per asset so switching slots does not cause extreme loudness jumps. The engine targets approximately 6 dB of headroom during ordinary layering and prevents output peaks above approximately -1 dBFS. The UI does not need a full mixer in this release, but the master meter state should be exposed for future visualization and clipping feedback.

## Parameter Behavior

All existing controls must have audible, deterministic behavior:

- **Trim A:** moves sample start within the buffer.
- **Trim B:** sets the sample end and cannot precede Trim A.
- **Tone A / Pitch:** transposes melodic playback in semitones within the current project range.
- **Tone B / Gain:** scales voice gain without bypassing master headroom protection.
- **Filter A:** maps the normalized value to a musically useful logarithmic cutoff range.
- **Filter B / Resonance:** maps the normalized value to a bounded filter Q range.

Preview and sequenced playback use the same rendering path so a sound does not change character after it is written to a step.

## Project and Error Handling

Malformed project JSON, unsupported versions, invalid audio MIME types, decode failures, IndexedDB failures, and missing imported assets are caught and surfaced through user-readable UI messages. File input handlers do not leave rejected promises or page errors.

Project export continues to serialize settings and asset references only. Starter assets always resolve from the deployed bundle. Imported asset references resolve only in the originating browser storage. Cross-device packaging is explicitly deferred.

Resetting the project restores starter slot references. It does not need to delete all previously imported IndexedDB assets in this release; asset cleanup can be handled by a later storage-management feature.

## Release-Blocker Repairs

1. Replace the stale smoke script selectors and workflows with the current NoteMaker interface.
2. Catch malformed project imports and show an error instead of raising a page exception.
3. Increase BPM nudge controls to a minimum 34 by 34 CSS pixels, with a 40-pixel target where layout allows.
4. Replace quarter-note step scheduling and visual timing with sixteenth-note timing.
5. Replace transient imported `blob:` persistence with IndexedDB-backed assets.
6. Replace synthesized starter-slot routing with sample playback.
7. Connect trim, pitch, gain, filter, and resonance to the audible signal path.
8. Add mix buses, layering-safe voices, hat choking, metering, and limiting.

## Verification Strategy

### Unit Tests

- Starter registry contains 16 unique, resolvable assets and valid metadata.
- C minor pentatonic performance keys map to the expected MIDI notes.
- Root-note and slot-pitch calculations produce expected playback rates.
- Sixteen steps map to one 4/4 bar of sixteenth-note transport positions.
- Trim offsets and durations clamp safely to decoded-buffer bounds.
- Filter and resonance mappings remain within defined audio ranges.
- Imported asset records serialize and restore through the storage adapter.
- Missing imported assets return a typed failure rather than a fallback sound.
- Choke-group and voice-limit logic target the correct active voices.

### Component Tests

- Invalid project files show an import error without an unhandled rejection.
- Invalid and undecodable audio files show an import error.
- A successful imported asset updates the selected slot with its stable asset ID.
- Playback controls and visible step state follow sixteenth-note timing.
- Parameter controls update the values consumed by the audio voice plan.

### Browser Smoke Tests

- Desktop and mobile load without console or page errors.
- A user can select a slot and key, enable write mode, add a trigger, remove it from Beat Flow, and play/stop the pattern.
- Tempo and active pattern persist after reload.
- A valid imported sample plays before and after reload in the same browser context.
- Invalid project and sample imports display errors without page exceptions.
- Project export downloads a valid NoteMaker JSON document.
- Mobile has no horizontal overflow and interactive controls meet the minimum target size.
- Eight same-step starter sounds play without scheduling exceptions or master clipping.

### Release Gate

The sound-engine branch is ready for Vercel planning only when unit tests, component tests, the production build, and the current Playwright smoke suite all pass. The smoke suite must run against both the local Vite server and, later, the Vercel preview URL.

## Deployment Boundary

The first Vercel deployment remains a static Vite deployment with no server-side audio storage. Vercel serves the application bundle and starter assets. Browser localStorage stores project state, while IndexedDB stores imported audio for that browser and domain. Because browser storage is origin-scoped, local imports do not automatically appear on the Vercel domain; users import sounds independently on each origin.

