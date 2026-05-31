import type { SampleAsset, SlotType } from "./types";

type StarterSoundDefinition = {
  id: number;
  type: SlotType;
  name: string;
  sample: SampleAsset;
};

const STARTER_NAMES = [
  "Mono Bass",
  "Glass Chord",
  "Dust Lead",
  "Square Pluck",
  "Tape Organ",
  "Soft Vox",
  "Arcade Note",
  "Warm Stab",
  "Kick",
  "Snare",
  "Closed Hat",
  "Open Hat",
  "Clap",
  "Rim",
  "Perc",
  "Texture"
] as const;

export const STARTER_SOUNDS: StarterSoundDefinition[] = STARTER_NAMES.map((name, index) => {
  const id = index + 1;
  return {
    id,
    type: id <= 8 ? "melodic" : "drum",
    name,
    sample: {
      id: `starter-${String(id).padStart(2, "0")}`,
      name,
      sourceType: "starter",
      durationSeconds: id <= 8 ? 1.6 : 0.55
    }
  };
});
