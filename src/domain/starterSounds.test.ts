import { describe, expect, it } from "vitest";
import { STARTER_SOUNDS } from "./starterSounds";

describe("starter sound registry", () => {
  it("defines 16 unique bundled sample assets", () => {
    expect(STARTER_SOUNDS).toHaveLength(16);
    expect(new Set(STARTER_SOUNDS.map((sound) => sound.sample.url)).size).toBe(16);
    expect(STARTER_SOUNDS.every((sound) => sound.sample.url?.startsWith("/audio/starter/"))).toBe(true);
  });

  it("defines tuning and mix metadata", () => {
    expect(STARTER_SOUNDS.slice(0, 8).every((sound) => Number.isFinite(sound.sample.rootMidi))).toBe(true);
    expect(STARTER_SOUNDS.every((sound) => (sound.sample.gainCompensation ?? 0) > 0)).toBe(true);
    expect(STARTER_SOUNDS[10].sample.chokeTargets).toEqual([12]);
  });
});
