# PO33 Rebuild MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current arranger-first NoteMaker app with a working PO-33-style browser instrument MVP.

**Architecture:** Replace the public app model with a 16-slot, 16-pattern PO33 project schema. Keep React, Zustand, Tone.js, and Vitest, but route the UI through a single device surface and route playback through deterministic pattern scheduling. Leave the old timeline component unused unless removing it is necessary for type/build health.

**Tech Stack:** Vite, React 19, TypeScript, Zustand, Tone.js, Vitest, Testing Library.

---

## File Structure

- `src/domain/types.ts`: replace track/clip types with PO33 project, slot, sample, pattern, step, trigger, and parameter types.
- `src/domain/starterSounds.ts`: create original starter sound metadata for 16 slots.
- `src/domain/project.ts`: create, parse, serialize, save, load, export, import, slot import, and pattern edit helpers for `notemaker.po33.v1`.
- `src/domain/sequencer.ts`: replace track/clip expansion with PO33 schedule planning.
- `src/audio/engine.ts`: adapt playback to schedule planned PO33 events using lightweight synth/sample-like tones for bundled source ids in MVP.
- `src/store/useProjectStore.ts`: replace arranger actions with selected slot, pattern, write mode, params, import, export, and toggle-step actions.
- `src/components/Po33Device.tsx`: create the device-first UI.
- `src/App.tsx`: remove old toolbar/deck/timeline/transport composition and render the PO33 device.
- `src/styles.css`: replace old visual system with the new instrument surface.
- `src/domain/project.test.ts`: rewrite project tests for new schema.
- `src/domain/sequencer.test.ts`: rewrite schedule tests for new pattern model.
- `src/audio/engine.test.ts`: rewrite engine tests for deterministic plans.
- `src/App.test.tsx`: rewrite component tests for the PO33 device.
- `README.md`, `docs/product/PRD.md`, `docs/product/pm-review.md`: update docs from old pocket arranger to PO33-style rebuild.

## Task 1: Domain Schema And Project Foundation

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/starterSounds.ts`
- Modify: `src/domain/project.ts`
- Test: `src/domain/project.test.ts`

- [ ] **Step 1: Write failing project schema tests**

```ts
import { describe, expect, it } from "vitest";
import { createDefaultProject, parseProject, serializeProject, toggleStepTrigger, updateSlotParams } from "./project";
import { PROJECT_VERSION } from "./types";

describe("PO33 project model", () => {
  it("creates a default 16-slot and 16-pattern project", () => {
    const project = createDefaultProject();

    expect(project.version).toBe(PROJECT_VERSION);
    expect(project.slots).toHaveLength(16);
    expect(project.patterns).toHaveLength(16);
    expect(project.slots.slice(0, 8).every((slot) => slot.type === "melodic")).toBe(true);
    expect(project.slots.slice(8).every((slot) => slot.type === "drum")).toBe(true);
    expect(project.activeSlotId).toBe(1);
    expect(project.activePatternId).toBe(1);
  });

  it("toggles pattern triggers without duplicating the same slot and key on a step", () => {
    const project = createDefaultProject();
    const withTrigger = toggleStepTrigger(project, 0, 1, 1);
    const withoutTrigger = toggleStepTrigger(withTrigger, 0, 1, 1);

    expect(withTrigger.patterns[0].steps[0].triggers).toEqual([
      { slotId: 1, keyIndex: 1, velocity: 0.85 }
    ]);
    expect(withoutTrigger.patterns[0].steps[0].triggers).toEqual([]);
  });

  it("updates slot parameters inside safe ranges", () => {
    const project = createDefaultProject();
    const updated = updateSlotParams(project, 1, { trimStart: -3, trimEnd: 99, gain: 3, pitch: -99 });
    const slot = updated.slots[0];

    expect(slot.trimStart).toBe(0);
    expect(slot.trimEnd).toBe(1);
    expect(slot.gain).toBe(1.5);
    expect(slot.pitch).toBe(-24);
  });

  it("round-trips the new project format", () => {
    const project = toggleStepTrigger(createDefaultProject(), 4, 9, 3);
    const parsed = parseProject(serializeProject(project));

    expect(parsed.version).toBe("notemaker.po33.v1");
    expect(parsed.patterns[0].steps[4].triggers[0]).toMatchObject({ slotId: 9, keyIndex: 3 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/domain/project.test.ts`

Expected: FAIL because `toggleStepTrigger`, `updateSlotParams`, and the PO33 types do not exist.

- [ ] **Step 3: Implement schema and project helpers**

Define `PROJECT_VERSION = "notemaker.po33.v1"`, slot ids 1-16, pattern ids 1-16, starter metadata, `createDefaultProject`, `serializeProject`, `parseProject`, `toggleStepTrigger`, and `updateSlotParams`.

- [ ] **Step 4: Run project tests**

Run: `npm run test -- src/domain/project.test.ts`

Expected: PASS.

## Task 2: Sequencer Planning

**Files:**
- Modify: `src/domain/sequencer.ts`
- Test: `src/domain/sequencer.test.ts`
- Modify: `src/audio/engine.ts`
- Test: `src/audio/engine.test.ts`

- [ ] **Step 1: Write failing schedule tests**

```ts
import { describe, expect, it } from "vitest";
import { createDefaultProject, toggleStepTrigger, updateSlotParams } from "./project";
import { createSchedulePlan, stepToSeconds } from "./sequencer";

describe("PO33 sequencer", () => {
  it("plans events from the active pattern", () => {
    const project = toggleStepTrigger(createDefaultProject(), 3, 9, 4);
    const plan = createSchedulePlan(project);

    expect(plan).toContainEqual(expect.objectContaining({ stepIndex: 3, slotId: 9, keyIndex: 4 }));
  });

  it("skips empty slots", () => {
    const project = createDefaultProject();
    const emptySlotProject = {
      ...project,
      slots: project.slots.map((slot) => (slot.id === 16 ? { ...slot, sample: null } : slot))
    };
    const withTrigger = toggleStepTrigger(emptySlotProject, 0, 16, 1);

    expect(createSchedulePlan(withTrigger)).toEqual([]);
  });

  it("maps trim and pitch into planned playback values", () => {
    const project = updateSlotParams(toggleStepTrigger(createDefaultProject(), 0, 1, 8), 1, {
      trimStart: 0.25,
      trimEnd: 0.75,
      pitch: 12
    });
    const [event] = createSchedulePlan(project);

    expect(event.trimStart).toBe(0.25);
    expect(event.trimEnd).toBe(0.75);
    expect(event.playbackRate).toBeCloseTo(2);
  });

  it("converts 16th-note steps at the current tempo", () => {
    expect(stepToSeconds(4, 120)).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/domain/sequencer.test.ts`

Expected: FAIL because `createSchedulePlan` does not yet use the new project schema.

- [ ] **Step 3: Implement deterministic schedule planning**

Create `SchedulePlanEntry` values with `patternId`, `stepIndex`, `slotId`, `keyIndex`, `seconds`, `durationSeconds`, `trimStart`, `trimEnd`, `gain`, `playbackRate`, `filter`, and `resonance`.

- [ ] **Step 4: Run sequencer and engine tests**

Run: `npm run test -- src/domain/sequencer.test.ts src/audio/engine.test.ts`

Expected: PASS.

## Task 3: Zustand Store

**Files:**
- Modify: `src/store/useProjectStore.ts`
- Test: covered through component tests and domain tests.

- [ ] **Step 1: Replace arranger state actions**

Expose `project`, `playing`, `currentStep`, `selectSlot`, `selectPattern`, `toggleWriteMode`, `toggleStep`, `setTempo`, `setParamMode`, `setKnobValue`, `importSlot`, `importProject`, `resetProject`, and `tickStep`.

- [ ] **Step 2: Persist every project mutation**

Use the same local-first pattern as the old store, but save `notemaker.po33.v1` payloads.

- [ ] **Step 3: Type-check store**

Run: `npm run lint`

Expected: PASS or only UI failures that Task 4 resolves.

## Task 4: Device UI Shell

**Files:**
- Create: `src/components/Po33Device.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write failing app tests**

```ts
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("PO33 NoteMaker app", () => {
  beforeEach(() => window.localStorage.clear());

  it("renders the PO33-style device surface", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /notemaker/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/lcd status/i)).toHaveTextContent(/pattern 01/i);
    expect(screen.getByRole("button", { name: /slot 01/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /write mode/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("grid", { name: /timeline/i })).not.toBeInTheDocument();
  });

  it("selects a slot and writes a step", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /slot 09/i }));
    fireEvent.click(screen.getByRole("button", { name: /write mode/i }));
    fireEvent.click(screen.getByRole("button", { name: /step 05/i }));

    expect(screen.getByLabelText(/lcd status/i)).toHaveTextContent(/slot 09/i);
    expect(screen.getByRole("button", { name: /step 05/i })).toHaveAttribute("aria-pressed", "true");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/App.test.tsx`

Expected: FAIL because `Po33Device` and the new app labels do not exist.

- [ ] **Step 3: Implement `Po33Device` and app composition**

Render LCD, step LEDs, 16 slot pads, pattern buttons, write/play/stop controls, param mode buttons, two range knobs, import/export/reset controls, and slot details.

- [ ] **Step 4: Replace CSS**

Use a restrained hardware-instrument surface with stable pad, LED, LCD, and control dimensions. Avoid the old children/storybook/minimap styles.

- [ ] **Step 5: Run app test**

Run: `npm run test -- src/App.test.tsx`

Expected: PASS.

## Task 5: Docs And Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/product/PRD.md`
- Modify: `docs/product/pm-review.md`

- [ ] **Step 1: Update docs**

Rewrite the docs to describe the PO33-style rebuild and original starter sounds.

- [ ] **Step 2: Run full tests**

Run: `npm run test`

Expected: PASS.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src docs README.md
git commit -m "feat: rebuild as po33-style sampler"
```

## Self-Review

- Spec coverage: the plan covers schema reset, store, device UI, pattern editing, original starter slots, deterministic scheduling, docs, tests, and build. Full decoded user audio import and advanced audible FX are intentionally deferred from this MVP execution because they require browser media mocks and a deeper audio asset pipeline; the schema leaves room for them.
- Placeholder scan: no `TBD`, `TODO`, or "fill in" markers are used.
- Type consistency: plan uses `slotId`, `patternId`, `keyIndex`, `trimStart`, `trimEnd`, `gain`, `pitch`, `filter`, and `resonance` consistently across domain, sequencer, audio, store, and UI tasks.

