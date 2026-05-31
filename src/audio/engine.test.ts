import { describe, expect, it } from "vitest";
import { createDefaultProject, toggleStepTrigger } from "../domain/project";
import { createSchedulePlan } from "./engine";

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
});
