import { describe, expect, it } from "vitest";
import { PERFORMANCE_KEY_MIDI, playbackRateForKey } from "./music";

describe("performance key tuning", () => {
  it("maps 16 keys to C minor pentatonic notes", () => {
    expect(PERFORMANCE_KEY_MIDI).toEqual([36, 39, 41, 43, 46, 48, 51, 53, 55, 58, 60, 63, 65, 67, 70, 72]);
  });

  it("combines root tuning and slot pitch into playback rate", () => {
    expect(playbackRateForKey(11, 60, 0)).toBeCloseTo(1);
    expect(playbackRateForKey(16, 60, 0)).toBeCloseTo(2);
    expect(playbackRateForKey(11, 60, -12)).toBeCloseTo(0.5);
  });
});
