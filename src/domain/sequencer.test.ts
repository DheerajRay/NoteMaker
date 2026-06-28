import { describe, expect, it } from "vitest";
import { adjustStepTimingOffset, createDefaultProject, toggleStepTrigger, updateSlotParams } from "./project";
import { createArrangementSchedulePlan, createSchedulePlan, stepToSeconds, stepToToneTime } from "./sequencer";
import type { Project } from "./types";

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

  it("schedules early timing offsets before the step", () => {
    const project = adjustStepTimingOffset(toggleStepTrigger(createDefaultProject(), 4, 9, 1), 4, -3);
    const [event] = createSchedulePlan({ ...project, tempo: 120 });

    expect(event.seconds).toBe(0.5);
    expect(event.timingOffsetTicks).toBe(-3);
    expect(event.timingOffsetSeconds).toBeCloseTo(-0.0625);
    expect(event.scheduledSeconds).toBeCloseTo(0.4375);
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

describe("Pattern production arrangement planning", () => {
  it("schedules repeated pattern clips at bar positions", () => {
    let project = createDefaultProject();
    project = toggleStepTrigger(project, 0, 9, 1);
    project = toggleStepTrigger(project, 4, 10, 1);
    project = {
      ...project,
      tempo: 120,
      arrangement: {
        ...project.arrangement,
        clips: [{ id: "clip-1", patternId: 1, laneId: "drums", startBar: 2, lengthBars: 2, muted: false }]
      }
    };

    const plan = createArrangementSchedulePlan(project);

    expect(plan).toHaveLength(4);
    expect(plan.map((entry) => entry.scheduledSeconds)).toEqual([4, 4.5, 6, 6.5]);
  });

  it("excludes muted clips and muted lanes from the production plan", () => {
    let project = toggleStepTrigger(createDefaultProject(), 0, 9, 1);
    project = {
      ...project,
      arrangement: {
        ...project.arrangement,
        lanes: project.arrangement.lanes.map((lane) => (lane.id === "bass" ? { ...lane, muted: true } : lane)),
        clips: [
          { id: "clip-muted", patternId: 1, laneId: "drums", startBar: 0, lengthBars: 1, muted: true },
          { id: "lane-muted", patternId: 1, laneId: "bass", startBar: 0, lengthBars: 1, muted: false }
        ]
      }
    };

    expect(createArrangementSchedulePlan(project)).toEqual([]);
  });

  it("allows overlapping clips in the same lane to both schedule", () => {
    let project = toggleStepTrigger(createDefaultProject(), 0, 9, 1);
    project = {
      ...project,
      arrangement: {
        ...project.arrangement,
        clips: [
          { id: "clip-a", patternId: 1, laneId: "drums", startBar: 0, lengthBars: 1, muted: false },
          { id: "clip-b", patternId: 1, laneId: "drums", startBar: 0, lengthBars: 1, muted: false }
        ]
      }
    };

    expect(createArrangementSchedulePlan(project)).toHaveLength(2);
  });

  it("ignores clips with invalid pattern or lane references", () => {
    const project = {
      ...toggleStepTrigger(createDefaultProject(), 0, 9, 1),
      arrangement: {
        ...createDefaultProject().arrangement,
        clips: [
          { id: "missing-pattern", patternId: 99, laneId: "drums", startBar: 0, lengthBars: 1, muted: false },
          { id: "missing-lane", patternId: 1, laneId: "nope", startBar: 0, lengthBars: 1, muted: false }
        ]
      }
    } as Project;

    expect(createArrangementSchedulePlan(project)).toEqual([]);
  });
});
