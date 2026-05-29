# NoteMaker Product Requirements

## Purpose

NoteMaker helps creative beginners make a short musical idea through a compact pocket-sequencer surface. The app should feel immediate and tactile: pick a pad sound, place it on the running step grid, loop the pattern, and hear the result without DAW setup.

## Audience

The first audience is teens and adults who want a playful music sketchpad without a full DAW. Younger users may enjoy the interface with adult support, but the MVP is not treated as a regulated child-directed service; v1 avoids accounts, social sharing, public profiles, and cloud storage.

## MVP Goals

- Create a loopable song using built-in instruments.
- Select from a 4x4 pad bank and place sounds directly onto the step grid.
- Place, move, resize, duplicate, repeat, and remove clips on a grid timeline.
- Show the track running through step LEDs, an active grid column, and a sequence overview playhead.
- Switch 16-step pattern windows and keep loop behavior obvious.
- Use tempo and loop controls to hear the song immediately.
- Save locally and export/import the project as JSON.
- Preserve an accessible interface: keyboard-focusable controls, labeled transport, meaningful grid roles, visible focus states, and reduced-motion support.

## Non-Goals

- Audio sample import, recording, trimming, waveform editing, and live FX processing.
- MIDI hardware input/output.
- User accounts, cloud sync, share links, collaboration, or payments.
- Full DAW automation, plugin hosting, or professional mixing.

## Acceptance Criteria

- A user can open the app and see a starter song with six instrument lanes.
- A user can start and stop playback after a browser gesture.
- A user can select a pad sound from the 4x4 performance deck and click a timeline step to create a clip.
- A user can drag an existing clip to a different step or lane.
- A user can see the active step moving through LEDs, the timeline, and the sequence overview while playback runs.
- A user can switch between Pattern 1 and Pattern 2 loop windows.
- A user can change tempo, loop range, mute/solo lanes, and repeat clips.
- A user can export a `.json` project and import it back without losing clip data.
- `npm run test` and `npm run build` pass.

## Roadmap

1. **Pocket sequencer polish:** keyboard clip movement, richer clip editor, undo/redo, better pad presets, pattern chaining, step multiplier, and parameter locks.
2. **Sampling phase:** microphone/input recording, imported audio clips, trim points, slices, fades, and clip gain.
3. **Performance FX phase:** wire punch-in FX controls to Tone.js/Web Audio processing with clear bypass and reset behavior.
4. **Sharing phase:** backend persistence, private share links, cloud quotas, and moderation/privacy decisions.
5. **Advanced phase:** MIDI input, recording, automation lanes, arrangement sections, and audio export.
