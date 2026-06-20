import { describe, expect, it } from "vitest";
import { createDefaultProject, toggleStepTrigger, updateSlotParams } from "../domain/project";
import { createSchedulePlan, createVoicePlan, filterFrequencyForValue, resonanceForValue, resolveTriggerStartTime } from "./engine";

describe("PO33 audio schedule plan", () => {
  it("creates deterministic schedule entries from pattern triggers", () => {
    const project = toggleStepTrigger(createDefaultProject(), 2, 10, 1);

    const plan = createSchedulePlan(project);

    expect(plan[0]).toMatchObject({
      patternId: 1,
      stepIndex: 2,
      slotId: 10,
      sampleName: "Snare",
      toneTime: "0:0:2"
    });
    expect(plan.every((entry) => entry.seconds >= 0)).toBe(true);
  });

  it("nudges trigger times that have slipped behind the audio clock", () => {
    expect(resolveTriggerStartTime(1.1, 1)).toBe(1.1);
    expect(resolveTriggerStartTime(0.98, 1)).toBeCloseTo(1.005);
    expect(resolveTriggerStartTime(1.004, 1, 1.004)).toBeCloseTo(1.009, 4);
  });

  it("creates a bounded voice plan from scheduled sample parameters", () => {
    const project = updateSlotParams(toggleStepTrigger(createDefaultProject(), 0, 1, 1), 1, {
      trimStart: 0.25,
      trimEnd: 0.75,
      filter: 0.5,
      resonance: 1,
      gain: 1
    });
    const [entry] = createSchedulePlan(project);

    expect(createVoicePlan(entry, 2)).toMatchObject({
      offsetSeconds: 0.5,
      sourceDurationSeconds: 1,
      playbackRate: 1,
      resonanceQ: 12
    });
  });

  it("maps filter controls to useful audio ranges", () => {
    expect(filterFrequencyForValue(0)).toBeCloseTo(120);
    expect(filterFrequencyForValue(1)).toBeCloseTo(18000);
    expect(resonanceForValue(0)).toBe(0.2);
    expect(resonanceForValue(1)).toBe(12);
  });
});
