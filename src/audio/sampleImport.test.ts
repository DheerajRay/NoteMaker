import { describe, expect, it, vi } from "vitest";
import { importAudioFile } from "./sampleImport";

function audioFile(type = "audio/wav") {
  return {
    name: "custom-kick.wav",
    type,
    arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer
  } as File;
}

describe("sample import", () => {
  it("rejects files that are not audio", async () => {
    await expect(importAudioFile(audioFile("text/plain"), {
      decodeDuration: vi.fn(),
      save: vi.fn(),
      createId: () => "sample-fixed"
    })).rejects.toThrow("Choose an audio file");
  });

  it("does not persist undecodable audio", async () => {
    const save = vi.fn();
    await expect(importAudioFile(audioFile(), {
      decodeDuration: vi.fn().mockRejectedValue(new Error("decode failed")),
      save,
      createId: () => "sample-fixed"
    })).rejects.toThrow("could not be decoded");
    expect(save).not.toHaveBeenCalled();
  });

  it("persists bytes and returns stable project metadata", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const asset = await importAudioFile(audioFile(), {
      decodeDuration: vi.fn().mockResolvedValue(0.75),
      save,
      createId: () => "sample-fixed"
    });

    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      id: "sample-fixed",
      mimeType: "audio/wav",
      durationSeconds: 0.75
    }));
    expect(asset).toMatchObject({
      id: "sample-fixed",
      name: "custom-kick",
      sourceType: "imported",
      durationSeconds: 0.75,
      mimeType: "audio/wav"
    });
    expect(asset.url).toBeUndefined();
  });
});
