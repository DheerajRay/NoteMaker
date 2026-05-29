# Test Strategy

## Unit Tests

- Project creation, serialization, parsing, and version rejection.
- Step quantization and time conversion.
- Clip repeat expansion, loop filtering, mute/solo behavior, and schedule ordering.
- Audio schedule plans without requiring a live browser audio context.

## Component Tests

- App shell renders the pocket composer controls.
- Pad selection creates clips on clicked grid cells.
- Future tests should cover drag/drop reducers, keyboard movement, clip resize controls, import error handling, and local storage recovery.

## Browser Verification

Use Playwright or the in-app browser after major UI changes:

- Desktop composer loads without console errors.
- Mobile layout stacks controls without overlap.
- User can select a sound pad and click a timeline step to create a clip.
- User can drag an existing clip to a different timeline step.
- User can export and import a project.
- Play button initializes audio after a gesture.
- Running playback visibly advances the deck LEDs, timeline step header, active cells, and sequence overview playhead.

## Accessibility

Check visible focus, role/name queries, transport labels, grid labeling, contrast on dark/metal surfaces, and reduced-motion behavior.

## Performance

Keep the DOM timeline acceptable for the 32-step MVP. Before increasing step counts substantially, profile drag latency and consider virtualizing or adding canvas only for dense overview layers.
