# NoteMaker PWA and App Icon Design

**Date:** 2026-06-21

## Objective

Make NoteMaker installable as a standalone progressive web app with a minimal, high-resolution icon that matches the orange hardware surface, dark controls, cream pads, and lime active-state accent.

## PWA Behavior

- App name and short name: `NoteMaker`.
- Start URL and scope: `/`.
- Display mode: `standalone`.
- Theme color: `#f18a36`.
- Background color: `#151513`.
- Orientation remains unrestricted so the instrument works on phones, tablets, and desktop windows.
- The service worker updates automatically when a new production build is available.
- The app shell, generated application bundles, icon assets, and bundled starter WAV files are precached.
- Navigation uses a network-first strategy with a cached fallback.
- Bundled starter audio uses cache-first delivery because filenames are versioned by the repository release.
- Imported audio remains in IndexedDB and is not transferred between origins or devices.

## Icon Direction

Use one original vector master with a 1024 by 1024 viewBox. The mark contains no text and remains legible at favicon size:

- Full-bleed charcoal rounded-square background.
- Orange sampler body with a dark inset display.
- One lime active step and three cream/dark performance pads.
- Heavy black outline and simple geometric forms matching the app UI.
- All essential details remain inside the maskable safe area.

Generated assets:

- `public/icons/notemaker-icon.svg`
- `public/icons/notemaker-1024.png`
- `public/icons/notemaker-512.png`
- `public/icons/notemaker-192.png`
- `public/icons/apple-touch-icon.png` at 180 pixels
- `public/icons/favicon-32.png`

The 192 and 512 pixel assets support both `any` and `maskable` manifest purposes because the master uses a full-bleed background and centered safe-zone artwork.

## Verification

- Production build emits `manifest.webmanifest` and a service worker.
- Manifest contains the approved name, colors, standalone display mode, and 192/512 icons.
- All generated icon files exist and have the expected pixel dimensions.
- Starter WAV assets appear in the service-worker precache manifest.
- Browser manifest fetch succeeds without console or page errors.
- Existing desktop/mobile smoke workflows continue to pass.
- Vercel production deployment passes the same PWA and application checks.

