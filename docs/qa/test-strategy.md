# Test Strategy

## Unit Tests

- Project creation, serialization, parsing, and version rejection.
- Step quantization and time conversion.
- Clip repeat expansion, loop filtering, mute/solo behavior, and schedule ordering.
- Audio schedule plans without requiring a live browser audio context.

## Component Tests

- App shell renders the required composer controls.
- Future tests should cover drag/drop reducers, keyboard movement, clip resize controls, import error handling, and local storage recovery.

## Browser Verification

Use Playwright or the in-app browser after major UI changes:

- Desktop composer loads without console errors.
- Mobile layout stacks controls without overlap.
- User can drag from palette to timeline.
- User can export and import a project.
- Play button initializes audio after a gesture.

## Accessibility

Check visible focus, role/name queries, transport labels, grid labeling, contrast on pastel backgrounds, and reduced-motion behavior.

## Performance

Keep the DOM timeline acceptable for the 32-step MVP. Before increasing step counts substantially, profile drag latency and consider virtualizing or adding canvas only for dense overview layers.
