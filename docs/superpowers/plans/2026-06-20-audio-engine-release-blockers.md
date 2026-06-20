# Audio Engine Release Blockers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder synth routing with a persistent, sample-first audio engine and clear all local release blockers before Vercel deployment.

**Architecture:** Bundled original WAV assets and IndexedDB-backed imports resolve through one asset loader. Independent Web Audio sample voices feed melodic and drum buses, a compressor/limiter chain, and a meter while Tone.Transport remains responsible for deterministic sequencing.

**Tech Stack:** React 19, TypeScript, Tone.js 15, Web Audio API, IndexedDB, Zustand, Vitest, Playwright, Vite.

---

### Task 1: Correct Musical Timing and Tuning

**Files:**
- Create: `src/audio/music.ts`
- Create: `src/audio/music.test.ts`
- Modify: `src/domain/sequencer.ts`
- Modify: `src/domain/sequencer.test.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing tests for C minor pentatonic MIDI mapping, root-note playback rate, sixteenth-note transport positions, and step duration.**
- [ ] **Step 2: Run `npm test -- src/audio/music.test.ts src/domain/sequencer.test.ts` and verify failures describe the missing mapping and old quarter-note timing.**
- [ ] **Step 3: Implement `PERFORMANCE_KEY_MIDI`, `playbackRateForKey`, sixteenth-note `stepToToneTime`, and sixteenth-note `stepToSeconds`.**
- [ ] **Step 4: Change the visual playhead interval to `60000 / tempo / 4`.**
- [ ] **Step 5: Run the targeted tests and commit the timing/tuning slice.**

### Task 2: Build the Original Starter Asset Library

**Files:**
- Create: `scripts/generate-starter-samples.mjs`
- Create: `public/audio/starter/*.wav`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/starterSounds.ts`
- Create: `src/domain/starterSounds.test.ts`

- [ ] **Step 1: Write a failing registry test requiring 16 unique asset URLs, melodic root MIDI metadata, gain compensation, and hat choke metadata.**
- [ ] **Step 2: Run the registry test and verify it fails against metadata-only starter sounds.**
- [ ] **Step 3: Add sample metadata fields and the explicit starter registry.**
- [ ] **Step 4: Add a deterministic WAV generator for eight melodic and eight drum designs, then generate the committed assets.**
- [ ] **Step 5: Run the registry tests and verify every generated file is present and non-empty.**

### Task 3: Persist Imported Audio in IndexedDB

**Files:**
- Create: `src/audio/sampleStore.ts`
- Create: `src/audio/sampleImport.ts`
- Create: `src/audio/sampleImport.test.ts`
- Modify: `src/store/useProjectStore.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write failing tests for MIME validation, decode failure, stable asset IDs, and persistence through an injected asset store.**
- [ ] **Step 2: Run the import tests and verify the desired service API is missing.**
- [ ] **Step 3: Implement the IndexedDB adapter, browser decoder, and testable import service.**
- [ ] **Step 4: Make the Zustand import action asynchronous and store only stable imported asset metadata in project state.**
- [ ] **Step 5: Add component coverage for successful and failed imports, then run targeted tests.**

### Task 4: Replace Synth Playback with Sample Voices and Mix Buses

**Files:**
- Rewrite: `src/audio/engine.ts`
- Modify: `src/audio/engine.test.ts`
- Modify: `src/domain/sequencer.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing tests for voice plans: trim bounds, playback rate, filter mapping, resonance mapping, gain compensation, and choke targets.**
- [ ] **Step 2: Run the engine tests and verify failures describe the absent sample voice behavior.**
- [ ] **Step 3: Implement starter/imported buffer loading and caching.**
- [ ] **Step 4: Implement independent AudioBufferSource voices with de-click envelopes, filters, per-slot limits, and open-hat choking.**
- [ ] **Step 5: Add melodic/drum buses, conservative gain staging, compressor/limiter, and master metering.**
- [ ] **Step 6: Make scheduling asynchronous so buffers are prepared before transport starts; use the same voice path for previews and sequenced events.**
- [ ] **Step 7: Run engine, sequencer, and app tests.**

### Task 5: Repair Import Errors and Mobile Targets

**Files:**
- Modify: `src/components/Po33Device.tsx`
- Modify: `src/store/useProjectStore.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write a failing component test asserting malformed project JSON produces a visible message instead of an unhandled rejection.**
- [ ] **Step 2: Implement a store error setter and catch project parsing/file-reading failures.**
- [ ] **Step 3: Increase BPM nudge controls to at least 34 by 34 CSS pixels.**
- [ ] **Step 4: Run component tests and TypeScript linting.**

### Task 6: Replace the Stale Browser Smoke Suite

**Files:**
- Rewrite: `scripts/smoke-check.mjs`
- Modify: `package.json` only if the command contract changes.

- [ ] **Step 1: Update the smoke selectors to the current instrument and add desktop/mobile workflows for writing, Beat Flow removal, transport, persistence, export, invalid imports, and responsive overflow.**
- [ ] **Step 2: Add an imported-sample reload check using a valid generated WAV fixture.**
- [ ] **Step 3: Run `npm run smoke` against the maintained Vite server and fix only behavior exposed by reproducible failures.**

### Task 7: Final Release-Gate Verification

**Files:**
- Modify documentation only if actual behavior differs from the approved design.

- [ ] **Step 1: Run `npm run test`.**
- [ ] **Step 2: Run `npm run lint`.**
- [ ] **Step 3: Run `npm run build`.**
- [ ] **Step 4: Run `npm run smoke`.**
- [ ] **Step 5: Inspect desktop and mobile screenshots and browser console output.**
- [ ] **Step 6: Review `git diff --check` and commit the verified implementation.**

