# NoteMaker Product Requirements

## Purpose

NoteMaker helps creative beginners make a short musical idea by arranging sound clips like stickers on a storybook map. The app should feel approachable without hiding the timing precision needed for music creation.

## Audience

The first audience is creative beginners: kids with adult support, teens, and adults who want a playful music sketchpad. The product is not treated as a regulated child-directed service in the MVP, so v1 avoids accounts, social sharing, public profiles, and cloud storage.

## MVP Goals

- Create a loopable song using built-in instruments.
- Place, move, resize, duplicate, repeat, and remove clips on a grid timeline.
- Use tempo and loop controls to hear the song immediately.
- Save locally and export/import the project as JSON.
- Preserve an accessible interface: keyboard-focusable controls, labeled transport, meaningful grid roles, visible focus states, and reduced-motion support.

## Non-Goals

- Audio sample import, recording, trimming, waveform editing, and FX chains.
- MIDI hardware input/output.
- User accounts, cloud sync, share links, collaboration, or payments.
- Full DAW automation, plugin hosting, or professional mixing.

## Acceptance Criteria

- A user can open the app and see a starter song with six instrument lanes.
- A user can start and stop playback after a browser gesture.
- A user can drag an instrument from the palette into the timeline to create a clip.
- A user can drag an existing clip to a different step or lane.
- A user can change tempo, loop range, mute/solo lanes, and repeat clips.
- A user can export a `.json` project and import it back without losing clip data.
- `npm run test` and `npm run build` pass.

## Roadmap

1. **Sequencer polish:** keyboard clip movement, richer clip editor, undo/redo, visual metronome, and better sound presets.
2. **Audio workstation phase:** imported audio clips, waveform view, trimming, fades, clip gain, and starter FX.
3. **Sharing phase:** backend persistence, private share links, cloud quotas, and moderation/privacy decisions.
4. **Advanced phase:** MIDI input, recording, automation lanes, arrangement sections, and audio export.
