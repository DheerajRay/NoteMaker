# Visual Direction

## Concept

The timeline is a pastel storybook map. Instruments are stickers. Clips are small path markers that sit on lanes. The app should look warm and hand-made, but the grid and controls must remain precise enough for repeated music editing.

## Tokens

- Background: soft paper cream with gentle green, yellow, and lavender accents.
- Ink: dark warm purple-gray for readable text.
- Track colors: coral drums, moss bass, periwinkle keys, honey bells, lavender pluck, aqua pad.
- Radius: 8px for cards, panels, clips, and buttons.
- Motion: subtle only; reduced-motion users should not lose functionality.

## Layout

- Top bar: project identity, status, import/export/reset.
- Left rail: draggable instrument palette.
- Center: scrollable DOM timeline with 32 visible steps and six lanes.
- Right rail: song inspector and map legend.
- Bottom bar: transport, tempo, and loop controls.

## Assets

Use original vector-style marks, generated bitmap textures, or permissively licensed audio/visual assets only. Do not include copyrighted sample packs, brand icons, or third-party illustrations without explicit licensing.

## Interaction States

- Clip idle: colored sticker with visible lane association.
- Clip drag: lower opacity and preserved sticker shape.
- Cell hover/drop: pale green highlight.
- Selected instrument: accent outline.
- Focus: high-contrast blue outline that remains visible over pastel backgrounds.
