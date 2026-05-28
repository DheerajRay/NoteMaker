import { describe, expect, it } from "vitest";
import { createDefaultProject } from "../domain/project";
import { createSchedulePlan } from "./engine";

describe("audio schedule plan", () => {
  it("creates deterministic schedule entries from project clips", () => {
    const project = createDefaultProject();

    const plan = createSchedulePlan(project);

    expect(plan[0]).toMatchObject({
      clipId: "clip-drums-1",
      trackId: "track-drums",
      instrumentId: "drum-kit",
      sound: "kick",
      toneTime: "0:0:0"
    });
    expect(plan.every((entry) => entry.seconds >= 0)).toBe(true);
  });
});
