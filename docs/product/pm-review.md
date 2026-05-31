# PM Review: PO33-Style Rebuild

## Decision

Reset NoteMaker around a PO33-style sampler workflow. The product should recreate the operating model users expect from a compact sampler: 16 sound slots, 16 patterns, write mode, step LEDs, slot/key selection, parameter knobs, starter sounds, sample import, project persistence, and performance-first controls.

This is a workflow recreation, not a brand clone. NoteMaker should not copy Teenage Engineering's factory audio, mascot artwork, exact graphic layout, trademarks in UI labels, or industrial design details.

## Product Thesis

The strongest v1 promise is: "make a beat on a tiny sampler in the browser." The app should make the machine state obvious: selected slot, active pattern, write mode, current step, tempo, and how many events will play.

## Functional Priorities

1. **Slot-first creation:** the 16 sound slots are the user's main entry point.
2. **Write-mode sequencing:** steps mutate pattern data only when write mode is enabled.
3. **Visible running state:** LCD and stable step LEDs show what the machine is doing.
4. **Original starter sounds:** ship a safe sound palette that teaches the workflow without copied audio.
5. **Local-first persistence:** JSON import/export and local storage remain the storage model.
6. **Browser-native import:** importing audio into the selected slot is part of the core workflow.
7. **Expandable audio engine:** schedule planning should be deterministic now and ready for decoded sample playback and FX next.

## UI Requirements

- Make the instrument the first screen.
- Keep pads, LEDs, pattern keys, and performance keys stable in size and position.
- Put LCD status near the top of the device.
- Use restrained hardware styling with high contrast and clear focus states.
- Do not use the old children/storybook/minimap visual language.
- Do not make a landing page.

## MVP Acceptance Criteria

- A new user can identify slots, steps, write mode, patterns, tempo, and selected slot without onboarding copy.
- Slot selection updates the LCD.
- Write mode plus a step click toggles a trigger for the selected slot.
- The schedule planner reads the active pattern and skips empty slots.
- Import/export preserves the new project format.
- Unit/component tests and build pass.

## Risks

- Users may expect exact PO-33 audio behavior. Keep UI copy generic and avoid claims of exact factory sound parity.
- Current imported audio stores object URL metadata but does not yet decode and persist audio bytes across sessions. The next sampler-core slice should address decoded buffer storage or explicit project asset packaging.
- Punch-in FX are not part of the first implemented slice; avoid making them look finished until the audio engine supports them.

## Next Product Slices

1. Decode imported files and play real sample buffers.
2. Add waveform preview and precise trim editing.
3. Implement pattern chaining playback.
4. Add parameter locks in write mode.
5. Build audible punch-in FX.
