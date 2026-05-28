# Visual Direction

## Concept

The timeline is a pastel storybook map. Instruments are stickers. Clips are small path markers that sit on lanes. The app should look warm and hand-made, but the grid and controls must remain precise enough for repeated music editing.

The second iteration adds a compact sampler/performance-deck influence: a small LCD-style status area, 16 running step lights, a 4x4 pad bank, pattern buttons, and a visible playhead. This takes interaction inspiration from pocket step sequencers like the PO-33 without copying their exact graphics, typography, mascot art, or industrial design.

## Tokens

- Background: soft paper cream with gentle green, yellow, and lavender accents.
- Ink: dark warm purple-gray for readable text.
- Track colors: coral drums, moss bass, periwinkle keys, honey bells, lavender pluck, aqua pad.
- Radius: 8px for cards, panels, clips, and buttons.
- Motion: subtle only; reduced-motion users should not lose functionality.

## Layout

- Top bar: project identity, status, import/export/reset.
- Left rail: draggable instrument palette.
- Center: pocket-style performance deck above a scrollable DOM timeline with 32 visible steps and six lanes.
- Right rail: song inspector and map legend.
- Bottom bar: transport, tempo, and loop controls.

## Assets

Use original vector-style marks, generated bitmap textures, or permissively licensed audio/visual assets only. Do not include copyrighted sample packs, brand icons, or third-party illustrations without explicit licensing.

## Interaction States

- Clip idle: colored sticker with visible lane association.
- Clip drag: lower opacity and preserved sticker shape.
- Cell hover/drop: pale green highlight.
- Selected instrument: accent outline.
- Active step: illuminated LED in the deck, dark step header in the timeline, and vertical playhead in the overview.
- Pattern button: selected pattern sets the loop to that 16-step window.
- Focus: high-contrast blue outline that remains visible over pastel backgrounds.
