import { describe, expect, it } from "vitest";
import { createDefaultProject, toggleStepTrigger, updateSlotParams } from "./project";
import { createSchedulePlan, stepToSeconds, stepToToneTime } from "./sequencer";

describe("PO33 sequencer timing", () => {
  it("converts 16th-note steps into Tone.js transport notation", () => {
    expect(stepToToneTime(0)).toBe("0:0:0");
    expect(stepToToneTime(3)).toBe("0:3:0");
    expect(stepToToneTime(4)).toBe("1:0:0");
    expect(stepToToneTime(15)).toBe("3:3:0");
  });

  it("converts 16th-note steps at the current tempo", () => {
    expect(stepToSeconds(4, 120)).toBe(2);
    expect(stepToSeconds(1, 60)).toBe(1);
  });
});

describe("PO33 schedule planning", () => {
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
});
