import { describe, expect, it } from "vitest";
import { adjustStepTimingOffset, createDefaultProject, parseProject, serializeProject, toggleStepTrigger, updateSlotParams } from "./project";
import { PROJECT_VERSION } from "./types";

describe("PO33 project model", () => {
  it("creates a default 16-slot and 16-pattern project", () => {
    const project = createDefaultProject();

    expect(project.version).toBe(PROJECT_VERSION);
    expect(project.tempo).toBe(112);
    expect(project.slots).toHaveLength(16);
    expect(project.patterns).toHaveLength(16);
    expect(project.slots.slice(0, 8).every((slot) => slot.type === "melodic")).toBe(true);
    expect(project.slots.slice(8).every((slot) => slot.type === "drum")).toBe(true);
    expect(project.activeSlotId).toBe(1);
    expect(project.activePatternId).toBe(1);
  });

  it("toggles pattern triggers without duplicating the same slot and key on a step", () => {
    const project = createDefaultProject();
    const withTrigger = toggleStepTrigger(project, 0, 1, 1);
    const withoutTrigger = toggleStepTrigger(withTrigger, 0, 1, 1);

    expect(withTrigger.patterns[0].steps[0].triggers).toEqual([
      { slotId: 1, keyIndex: 1, velocity: 0.85 }
    ]);
    expect(withoutTrigger.patterns[0].steps[0].triggers).toEqual([]);
  });

  it("updates slot parameters inside safe ranges", () => {
    const project = createDefaultProject();
    const updated = updateSlotParams(project, 1, { trimStart: -3, trimEnd: 99, gain: 3, pitch: -99 });
    const slot = updated.slots[0];

    expect(slot.trimStart).toBe(0);
    expect(slot.trimEnd).toBe(1);
    expect(slot.gain).toBe(1.5);
    expect(slot.pitch).toBe(-24);
  });

  it("adjusts step timing offsets inside safe ranges", () => {
    const project = createDefaultProject();
    const nudgedLate = adjustStepTimingOffset(project, 0, 2);
    const nudgedEarly = adjustStepTimingOffset(nudgedLate, 0, -9);

    expect(nudgedLate.patterns[0].steps[0].timingOffsetTicks).toBe(2);
    expect(nudgedEarly.patterns[0].steps[0].timingOffsetTicks).toBe(-3);
    expect(nudgedEarly.patterns[0].steps[1].timingOffsetTicks).toBe(0);
  });

  it("round-trips the new project format", () => {
    const project = toggleStepTrigger(createDefaultProject(), 4, 9, 3);
    const parsed = parseProject(serializeProject(project));

    expect(parsed.version).toBe("notemaker.po33.v1");
    expect(parsed.patterns[0].steps[4].triggers[0]).toMatchObject({ slotId: 9, keyIndex: 3 });
    expect(parsed.patterns[0].steps[4].timingOffsetTicks).toBe(0);
  });

  it("restores bundled metadata for starter sounds saved by older builds", () => {
    const project = createDefaultProject();
    const legacy = {
      ...project,
      slots: project.slots.map((slot) => ({
        ...slot,
        sample: slot.sample ? { id: slot.sample.id, name: slot.sample.name, sourceType: "starter", durationSeconds: slot.sample.durationSeconds } : null
      }))
    };

    const parsed = parseProject(JSON.stringify(legacy));

    expect(parsed.slots[0].sample?.url).toBe("/audio/starter/01-mono-bass.wav");
    expect(parsed.slots[0].sample?.rootMidi).toBe(36);
  });

  it("falls back to bundled samples when a saved slot contains an imported sound", () => {
    const project = createDefaultProject();
    const savedWithImportedSound = {
      ...project,
      slots: project.slots.map((slot) =>
        slot.id === 1
          ? {
              ...slot,
              name: "Accidental Import",
              sample: {
                id: "sample-accidental",
                name: "Accidental Import",
                sourceType: "imported",
                durationSeconds: 1.2,
                rootMidi: 60
              }
            }
          : slot
      )
    };

    const parsed = parseProject(JSON.stringify(savedWithImportedSound));

    expect(parsed.slots[0].name).toBe("Mono Bass");
    expect(parsed.slots[0].sample?.sourceType).toBe("starter");
    expect(parsed.slots[0].sample?.url).toBe("/audio/starter/01-mono-bass.wav");
  });

  it("rejects unsupported project versions", () => {
    expect(() => parseProject(JSON.stringify({ version: "notemaker.project.v1" }))).toThrow(
      "Unsupported NoteMaker project version"
    );
  });
});
