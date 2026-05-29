# PM Review: Pocket Sequencer Pivot

## Decision

Pivot NoteMaker away from the previous illustrated arranger concept and toward an original compact pocket sampler/sequencer surface. The new direction should keep the beginner-friendly goal, but the first screen should feel like a small performance instrument: pads, LEDs, patterns, a tiny status display, and a running track state.

The PO-33 is useful as product inspiration because it proves that a 16-step, 16-pad sampler can feel deep without a full DAW. NoteMaker should borrow the workflow ideas, not the brand identity, art, exact layout, typography, graphics, or industrial design.

## Product Thesis

The strongest v1 promise is: "make a beat loop quickly on a playful pocket device in the browser." This gives users an obvious action model: choose a pad, place a step, press play, watch it run.

## Functional Priorities

1. **Pad-first creation:** The 4x4 pad bank is the primary sound picker. Users select a pad, then click timeline steps to place clips.
2. **Visible running state:** Playback must be visible in multiple places: step LEDs, active grid column, active cells, and sequence overview playhead.
3. **Pattern windows:** Pattern buttons should map cleanly to 16-step loop ranges. Pattern chaining can come later, but the current behavior should teach the concept.
4. **Grid editing remains:** Drag, resize, repeat, copy, remove, mute, and solo preserve the advantage of a web arranger over a tiny hardware screen.
5. **Punch-in FX are staged:** FX buttons belong in the UI now as a product promise, but should not be represented as finished audio processing until wired to the audio engine.
6. **Local-first persistence:** Project JSON and local storage remain correct for v1; no accounts or cloud sync.

## UI Requirements

- Use a dark workbench around a warm metal device body.
- Put the LCD/status display near the step LEDs so playback state is immediately readable.
- Keep the 16 step LEDs stable in size and position; they should not shift when active.
- Make pads feel tactile with clear selected, hover, focus, and pressed states.
- Keep the timeline functional and dense rather than decorative; it is the arranger view, not a marketing hero.
- Use high-contrast labels despite the playful surface.
- Avoid copied PO-33 mascots, graphics, color placement, typography, and exact device proportions.

## MVP Acceptance Criteria

- A new user can identify the pad bank, transport, timeline, and tempo controls without onboarding copy.
- A selected pad creates a clip when the user clicks a timeline cell.
- Playback visibly advances through the deck and timeline.
- Pattern 1 and Pattern 2 set predictable 16-step loop windows.
- JSON export/import preserves the project after the pivot.
- Unit/component tests, build, and smoke verification pass.

## Risks

- The pocket-device surface can become visually dense for beginners. Keep labels plain and avoid hidden mode combinations in v1.
- Punch-in FX buttons may imply audio behavior that is not implemented yet. Treat them as staged controls until the engine supports them.
- Keyboard workflows need to catch up with pointer workflows. This should be one of the first polish tasks after the visual pivot.

## Next Product Slices

1. Wire pad velocity or accent controls into clip creation.
2. Add keyboard movement for clips and pads.
3. Add undo/redo for grid edits.
4. Implement pattern chaining across more than two pattern windows.
5. Wire punch-in FX to real Tone.js/Web Audio effects with tests for state changes and manual audio verification.
