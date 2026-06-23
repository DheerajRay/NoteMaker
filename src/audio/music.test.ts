import { describe, expect, it } from "vitest";
import { DRUM_KEY_VARIATIONS, PERFORMANCE_KEY_MIDI, drumVariationForKey, playbackRateForKey } from "./music";

describe("performance key tuning", () => {
  it("maps 16 keys to C minor pentatonic notes", () => {
    expect(PERFORMANCE_KEY_MIDI).toEqual([36, 39, 41, 43, 46, 48, 51, 53, 55, 58, 60, 63, 65, 67, 70, 72]);
  });

  it("combines root tuning and slot pitch into playback rate", () => {
    expect(playbackRateForKey(11, 60, 0)).toBeCloseTo(1);
    expect(playbackRateForKey(16, 60, 0)).toBeCloseTo(2);
    expect(playbackRateForKey(11, 60, -12)).toBeCloseTo(0.5);
  });

  it("defines 16 named drum performance variations", () => {
    expect(DRUM_KEY_VARIATIONS.map((variation) => variation.label)).toEqual([
      "Sub",
      "Low",
      "Deep",
      "Dark",
      "Soft",
      "Clean",
      "Punch",
      "Short",
      "Bright",
      "Tight",
      "Snap",
      "Tick",
      "Boom",
      "Knock",
      "Clip",
      "Chip"
    ]);
  });

  it("looks up drum variations with clamped key indexes", () => {
    expect(drumVariationForKey(1).label).toBe("Sub");
    expect(drumVariationForKey(16).label).toBe("Chip");
    expect(drumVariationForKey(40).label).toBe("Chip");
    expect(drumVariationForKey(-3).label).toBe("Sub");
  });
});
