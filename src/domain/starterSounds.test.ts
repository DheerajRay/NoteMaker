import { describe, expect, it } from "vitest";
import { STARTER_SOUNDS } from "./starterSounds";

describe("starter sound registry", () => {
  it("defines 47 unique bundled sample assets and one add placeholder", () => {
    const playableSounds = STARTER_SOUNDS.filter((sound) => sound.sample);

    expect(STARTER_SOUNDS).toHaveLength(48);
    expect(playableSounds).toHaveLength(47);
    expect(new Set(playableSounds.map((sound) => sound.sample?.url)).size).toBe(47);
    expect(playableSounds.every((sound) => sound.sample?.url?.startsWith("/audio/starter/"))).toBe(true);
    expect(STARTER_SOUNDS[47]).toMatchObject({ id: 48, name: "Add Sound", sample: null, isPlaceholder: true });
  });

  it("defines tuning and mix metadata", () => {
    const playableSounds = STARTER_SOUNDS.filter((sound) => sound.sample);

    expect(STARTER_SOUNDS.slice(0, 8).every((sound) => Number.isFinite(sound.sample?.rootMidi))).toBe(true);
    expect(playableSounds.every((sound) => (sound.sample?.gainCompensation ?? 0) > 0)).toBe(true);
    expect(STARTER_SOUNDS[10].sample?.chokeTargets).toEqual([12]);
  });
});
