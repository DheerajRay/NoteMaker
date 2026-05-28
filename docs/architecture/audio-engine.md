# Audio Engine Architecture

## Interface

The audio layer exposes the planned interface through `NoteMakerAudioEngine`:

- `init()`: lazy-loads Tone.js and unlocks audio after a user gesture.
- `loadInstrument(instrumentId)`: creates a synth for the instrument lane.
- `scheduleProject(project)`: clears previous events, applies tempo/loop, and schedules the current project.
- `play()`, `pause()`, `stop()`: transport controls.
- `setTempo()` and `setLoop()`: runtime transport updates.
- `dispose()`: clears scheduled events and releases synths.

## Timing Model

The project grid uses integer steps. One step currently maps to one Tone.js beat subdivision in `bar:beat:sixteenth` notation, with four steps per bar for the beginner grid. Schedule tests assert deterministic conversion and sorted event order.

## Scheduling

`expandProjectEvents(project)` expands clip repeat counts into audible events, filters muted/soloed tracks, applies loop boundaries, and preserves visual track order for same-step events. `createSchedulePlan(project)` converts those events into Tone transport notation, seconds, note names, and durations.

## Browser Constraints

Browsers require a user gesture before audio can start. The UI initializes the engine from the Play button and does not attempt autoplay. The engine schedules synthesized built-in sounds only; imported audio buffers are deferred to the workstation phase.
