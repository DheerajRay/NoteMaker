import { describe, expect, it } from "vitest";
import { createDefaultProject, parseProject, serializeProject } from "./project";

describe("project documents", () => {
  it("creates a beginner-ready default project", () => {
    const project = createDefaultProject();

    expect(project.version).toBe("notemaker.project.v1");
    expect(project.tempo).toBe(112);
    expect(project.loop).toEqual({ startStep: 0, endStep: 32, enabled: true });
    expect(project.tracks.map((track) => track.instrumentId)).toEqual([
      "drum-kit",
      "bass",
      "keys",
      "bells",
      "pluck",
      "pad"
    ]);
  });

  it("round-trips project JSON without losing clip data", () => {
    const project = createDefaultProject();
    project.clips[0].repeat = 3;

    const parsed = parseProject(serializeProject(project));

    expect(parsed.version).toBe("notemaker.project.v1");
    expect(parsed.clips[0].repeat).toBe(3);
  });

  it("rejects unsupported project versions", () => {
    expect(() =>
      parseProject(JSON.stringify({ version: "unknown", tracks: [], clips: [] }))
    ).toThrow("Unsupported NoteMaker project version");
  });
});
