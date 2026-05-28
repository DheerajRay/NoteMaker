# Research Notes

## Browser Audio

The MVP uses Web Audio through Tone.js. Web Audio gives low-level timing primitives, while Tone.js supplies musical transport abstractions that are easier to reason about in bars, beats, and repeatable sequences.

Sources:

- MDN Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- MDN AudioScheduledSourceNode: https://developer.mozilla.org/en-US/docs/Web/API/AudioScheduledSourceNode
- Tone.js Transport and sequence documentation: https://github.com/tonejs/tone.js/wiki/Transport and https://tonejs.github.io/docs/

## Interaction Model

dnd-kit is used for drag/drop because it supports React, typed drag metadata, pointer sensors, and keyboard sensors. The timeline remains DOM-based for v1 so cells, clips, and buttons can be labeled and tested without canvas-only accessibility work.

Source: https://dndkit.com/

## Beginner Reference

Chrome Music Lab validates a low-account, beginner-friendly music model. NoteMaker borrows the “start making immediately” principle, not the exact visual style or implementation.

Source: https://musiclab.chromeexperiments.com/About/

## Later Waveform Editing

wavesurfer.js is a useful later reference for region/waveform workflows, but v1 should not ship waveform editing. Pulling it in early would add complexity before the core grid arranger is stable.

Source: https://wavesurfer.xyz/docs/

## Design Handoff

Figma remains the source for visual system artifacts. The intended workflow is: create design tokens/components in Figma, create composer screens and interaction states, then add Code Connect once React components stabilize.

Sources: https://www.figma.com/dev-mode/ and https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect
