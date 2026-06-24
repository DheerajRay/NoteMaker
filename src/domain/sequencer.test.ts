import { describe, expect, it } from "vitest";
import { adjustStepTimingOffset, createDefaultProject, toggleStepTrigger, updateSlotParams } from "./project";
import { createSchedulePlan, stepToSeconds, stepToToneTime } from "./sequencer";

describe("PO33 sequencer timing", () => {
  it("converts 16th-note steps into Tone.js transport notation", () => {
    expect(stepToToneTime(0)).toBe("0:0:0");
    expect(stepToToneTime(3)).toBe("0:0:3");
    expect(stepToToneTime(4)).toBe("0:1:0");
    expect(stepToToneTime(15)).toBe("0:3:3");
  });

  it("converts 16th-note steps at the current tempo", () => {
    expect(stepToSeconds(4, 120)).toBe(0.5);
    expect(stepToSeconds(1, 60)).toBe(0.25);
  });

  it("converts step timing offset ticks into seconds", () => {
    const project = updateSlotParams(
      adjustStepTimingOffset(toggleStepTrigger(createDefaultProject(), 4, 9, 1), 4, 2),
      9,
      {}
    );
    const [event] = createSchedulePlan({ ...project, tempo: 120 });

    expect(event.seconds).toBe(0.5);
    expect(event.timingOffsetTicks).toBe(2);
    expect(event.timingOffsetSeconds).toBeCloseTo(0.041666, 5);
    expect(event.scheduledSeconds).toBeCloseTo(0.541666, 5);
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
    const project = updateSlotParams(toggleStepTrigger(createDefaultProject(), 0, 1, 1), 1, {
      trimStart: 0.25,
      trimEnd: 0.75,
      pitch: 12
    });
    const [event] = createSchedulePlan(project);

    expect(event.trimStart).toBe(0.25);
    expect(event.trimEnd).toBe(0.75);
    expect(event.playbackRate).toBeCloseTo(2);
  });

  it("keeps melodic performance keys mapped to pitch", () => {
    const lowKeyProject = toggleStepTrigger(createDefaultProject(), 0, 1, 1);
    const highKeyProject = toggleStepTrigger(createDefaultProject(), 0, 1, 16);

    expect(createSchedulePlan(lowKeyProject)[0].playbackRate).toBeLessThan(createSchedulePlan(highKeyProject)[0].playbackRate);
  });

  it("maps drum performance keys to distinct playback variations", () => {
    const project = createDefaultProject();
    const entries = Array.from({ length: 16 }, (_, index) =>
      createSchedulePlan(toggleStepTrigger(project, 0, 9, index + 1))[0]
    );

    expect(new Set(entries.map((entry) => entry.playbackRate.toFixed(4))).size).toBeGreaterThan(8);
    expect(new Set(entries.map((entry) => entry.filter.toFixed(4))).size).toBeGreaterThan(8);
    expect(new Set(entries.map((entry) => entry.durationSeconds.toFixed(4))).size).toBeGreaterThan(8);
    expect(new Set(entries.map((entry) => entry.gain.toFixed(4))).size).toBeGreaterThan(4);
  });

  it("applies drum variations to imported drum samples", () => {
    const project = {
      ...createDefaultProject(),
      slots: createDefaultProject().slots.map((slot) =>
        slot.id === 9
          ? {
              ...slot,
              sample: {
                id: "imported-kick",
                name: "Imported Kick",
                sourceType: "imported" as const,
                durationSeconds: 1,
                gainCompensation: 1
              }
            }
          : slot
      )
    };

    const sub = createSchedulePlan(toggleStepTrigger(project, 0, 9, 1))[0];
    const chip = createSchedulePlan(toggleStepTrigger(project, 0, 9, 16))[0];

    expect(sub.sampleName).toBe("Imported Kick");
    expect(sub.playbackRate).not.toBeCloseTo(chip.playbackRate);
    expect(sub.durationSeconds).not.toBeCloseTo(chip.durationSeconds);
  });
});
