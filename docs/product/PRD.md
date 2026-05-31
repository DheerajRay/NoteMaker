# NoteMaker Product Requirements

## Purpose

NoteMaker helps teen beatmakers use a browser-based sampler that behaves like a compact 16-slot, 16-step pocket instrument. The first screen should be the instrument: pick a slot, enter write mode, punch steps, change tempo, trim/tone/filter the selected sound, and hear the loop immediately.

## Audience

The primary audience is teens and adults who want a tactile sampler workflow without setting up a DAW. This is not a child-directed service and does not include accounts, social sharing, public profiles, cloud storage, or payments in v1.

## MVP Goals

- Create a loop using 16 sound slots and 16-step patterns.
- Use original starter sounds instead of copied factory audio.
- Treat slots 1-8 as melodic slots and slots 9-16 as drum slots.
- Select a slot, select a key, enter write mode, and toggle pattern steps.
- Show active machine state through LCD text, selected pads, step LEDs, and transport state.
- Switch between 16 patterns.
- Adjust tempo, trim, tone, and filter parameters for the active slot.
- Import a browser-supported audio file into the selected slot.
- Save locally and export/import the project as JSON.
- Preserve accessibility basics: labeled controls, visible focus, and reduced-motion support.

## Non-Goals

- Bundling Teenage Engineering factory audio, UI artwork, mascot graphics, exact layout, or trademarks as UI labels.
- Full DAW timeline editing as the primary surface.
- MIDI hardware input/output.
- User accounts, cloud sync, share links, collaboration, or payments.
- Professional mixing, plugin hosting, or full audio mastering.

## Acceptance Criteria

- A user opens the app and sees a single hardware-like sampler surface.
- A default project contains 16 original starter slots and 16 empty patterns.
- A user can select slot 09, enable write mode, click step 05, and see that step become active.
- Playback visibly advances through the step LEDs.
- The deterministic schedule planner creates events from the active pattern.
- A user can import an audio file into the selected slot.
- A user can export a `.notemaker.json` project and import it back.
- Old storybook, mini-map, and arranger-first UI concepts are absent.
- `npm run test` and `npm run build` pass.

## Roadmap

1. **Sampler core:** decoded imported audio playback, waveform preview, precise trim handles, slot clearing, slot copying, and memory metering.
2. **Performance workflow:** live recording, pattern chaining playback, parameter locks, velocity accents, and better key behavior for melodic/drum slots.
3. **Punch-in FX:** audible loop, stutter, retrigger, reverse, filter, pitch, and tape-style effects with visible active state.
4. **Export phase:** rendered audio export and project backup improvements.
5. **Advanced phase:** microphone sampling, MIDI input, richer pattern operations, and optional private sharing.
