import { describe, expect, it } from "vitest";
import { createDefaultProject, toggleStepTrigger } from "../domain/project";
import { createSchedulePlan, resolveTriggerStartTime } from "./engine";

describe("PO33 audio schedule plan", () => {
  it("creates deterministic schedule entries from pattern triggers", () => {
    const project = toggleStepTrigger(createDefaultProject(), 2, 10, 1);

    const plan = createSchedulePlan(project);

    expect(plan[0]).toMatchObject({
      patternId: 1,
      stepIndex: 2,
      slotId: 10,
      sampleName: "Snare",
      toneTime: "0:2:0"
    });
    expect(plan.every((entry) => entry.seconds >= 0)).toBe(true);
  });

  it("nudges trigger times that have slipped behind the audio clock", () => {
    expect(resolveTriggerStartTime(1.1, 1)).toBe(1.1);
    expect(resolveTriggerStartTime(0.98, 1)).toBeCloseTo(1.005);
    expect(resolveTriggerStartTime(1.004, 1, 1.004)).toBeCloseTo(1.009, 4);
  });
});
