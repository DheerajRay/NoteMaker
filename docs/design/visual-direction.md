# Visual Direction

## Concept

The product direction is now a compact pocket sampler and step sequencer, not an illustrated arranger concept. The interface should feel like a small performance device translated to the browser: immediate, tactile, slightly toy-like, and precise enough to make a clean loop.

The inspiration is the workflow density of pocket step sequencers: a tiny status display, 16 running step lights, a 4x4 pad bank, pattern buttons, and punch-in performance controls. NoteMaker must keep original visuals, labels, proportions, typography, colors, and marks; it should not copy Teenage Engineering trade dress or any branded PO-33 graphics.

## Tokens

- Background: dark desk surface behind a warm metal device panel.
- Device body: muted brass, charcoal, cream, coral, teal, and amber accents.
- Display: dark LCD field with pale green text and active status indicators.
- Track colors: coral drums, moss bass, periwinkle keys, honey bells, lavender pluck, aqua pad.
- Radius: 4-8px for hardware-like buttons, clips, and controls.
- Motion: subtle only; reduced-motion users should not lose functionality.

## Layout

- Top bar: project identity, status, import/export/reset.
- Center: pocket performance deck above a scrollable DOM timeline with 32 visible steps and six lanes.
- Performance deck: LCD readout, 16 step LEDs, pattern bank, 4x4 pad bank, and punch-in FX bank.
- Session readout: compact chips for audio state, loop window, and selected sound.
- Bottom bar: transport, tempo, and loop controls.

## Assets

Use original vector-style marks, generated bitmap textures, or permissively licensed audio/visual assets only. Do not include copyrighted sample packs, brand icons, third-party illustrations, or copied device graphics without explicit licensing.

## Interaction States

- Clip idle: compact colored block with visible lane association.
- Clip drag: lower opacity and preserved block geometry.
- Cell hover/drop: amber or LCD-green highlight.
- Selected pad: active ring, inverted display color, and readable pad label.
- Active step: illuminated LED in the deck, active step header in the timeline, active cells, and vertical playhead in the sequence overview.
- Pattern button: selected pattern sets the loop to that 16-step window.
- Punch-in FX: visible buttons now; future audio wiring must show active, latched, and momentary states separately.
- Focus: high-contrast outline that remains visible over dark and metal surfaces.
