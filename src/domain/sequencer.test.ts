import { describe, expect, it } from "vitest";
import { createDefaultProject } from "./project";
import { expandProjectEvents, quantizeStep, stepToSeconds, stepToToneTime } from "./sequencer";

describe("sequencer timing", () => {
  it("converts grid steps into Tone.js transport notation", () => {
    expect(stepToToneTime(0)).toBe("0:0:0");
    expect(stepToToneTime(3)).toBe("0:3:0");
    expect(stepToToneTime(4)).toBe("1:0:0");
    expect(stepToToneTime(15)).toBe("3:3:0");
  });

  it("converts sixteenth-note steps into seconds at the project tempo", () => {
    expect(stepToSeconds(4, 120)).toBe(2);
    expect(stepToSeconds(1, 60)).toBe(1);
  });

  it("quantizes dropped cells into the project step range", () => {
    expect(quantizeStep(-3, 32)).toBe(0);
    expect(quantizeStep(9.6, 32)).toBe(10);
    expect(quantizeStep(42, 32)).toBe(31);
  });
});

describe("project event expansion", () => {
  it("expands repeating clips into scheduled note events", () => {
    const project = createDefaultProject();
    project.clips = [
      {
        id: "clip-a",
        trackId: "track-drums",
        startStep: 2,
        lengthSteps: 4,
        repeat: 2,
        events: [
          { step: 0, sound: "kick", velocity: 0.9, durationSteps: 1 },
          { step: 2, sound: "snare", velocity: 0.7, durationSteps: 1 }
        ]
      }
    ];

    expect(expandProjectEvents(project)).toEqual([
      {
        clipId: "clip-a",
        trackId: "track-drums",
        instrumentId: "drum-kit",
        sound: "kick",
        step: 2,
        durationSteps: 1,
        velocity: 0.9
      },
      {
        clipId: "clip-a",
        trackId: "track-drums",
        instrumentId: "drum-kit",
        sound: "snare",
        step: 4,
        durationSteps: 1,
        velocity: 0.7
      },
      {
        clipId: "clip-a",
        trackId: "track-drums",
        instrumentId: "drum-kit",
        sound: "kick",
        step: 6,
        durationSteps: 1,
        velocity: 0.9
      },
      {
        clipId: "clip-a",
        trackId: "track-drums",
        instrumentId: "drum-kit",
        sound: "snare",
        step: 8,
        durationSteps: 1,
        velocity: 0.7
      }
    ]);
  });
});
