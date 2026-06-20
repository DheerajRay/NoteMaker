import type { SampleAsset, SlotType } from "./types";

type StarterSoundDefinition = {
  id: number;
  type: SlotType;
  name: string;
  sample: SampleAsset;
};

type StarterConfig = {
  name: string;
  file: string;
  durationSeconds: number;
  rootMidi?: number;
  gainCompensation: number;
  chokeTargets?: number[];
};

const STARTER_CONFIGS: StarterConfig[] = [
  { name: "Mono Bass", file: "01-mono-bass.wav", durationSeconds: 1.2, rootMidi: 36, gainCompensation: 0.82 },
  { name: "Glass Chord", file: "02-glass-chord.wav", durationSeconds: 1.45, rootMidi: 60, gainCompensation: 0.58 },
  { name: "Dust Lead", file: "03-dust-lead.wav", durationSeconds: 1.1, rootMidi: 60, gainCompensation: 0.68 },
  { name: "Square Pluck", file: "04-square-pluck.wav", durationSeconds: 0.72, rootMidi: 60, gainCompensation: 0.72 },
  { name: "Tape Organ", file: "05-tape-organ.wav", durationSeconds: 1.6, rootMidi: 60, gainCompensation: 0.56 },
  { name: "Soft Vox", file: "06-soft-vox.wav", durationSeconds: 1.5, rootMidi: 60, gainCompensation: 0.62 },
  { name: "Arcade Note", file: "07-arcade-note.wav", durationSeconds: 0.62, rootMidi: 72, gainCompensation: 0.7 },
  { name: "Warm Stab", file: "08-warm-stab.wav", durationSeconds: 0.82, rootMidi: 60, gainCompensation: 0.6 },
  { name: "Kick", file: "09-kick.wav", durationSeconds: 0.52, gainCompensation: 0.9 },
  { name: "Snare", file: "10-snare.wav", durationSeconds: 0.42, gainCompensation: 0.72 },
  { name: "Closed Hat", file: "11-closed-hat.wav", durationSeconds: 0.12, gainCompensation: 0.58, chokeTargets: [12] },
  { name: "Open Hat", file: "12-open-hat.wav", durationSeconds: 0.62, gainCompensation: 0.52 },
  { name: "Clap", file: "13-clap.wav", durationSeconds: 0.38, gainCompensation: 0.64 },
  { name: "Rim", file: "14-rim.wav", durationSeconds: 0.18, gainCompensation: 0.7 },
  { name: "Perc", file: "15-perc.wav", durationSeconds: 0.38, gainCompensation: 0.68 },
  { name: "Texture", file: "16-texture.wav", durationSeconds: 0.72, gainCompensation: 0.5 }
];

export const STARTER_SOUNDS: StarterSoundDefinition[] = STARTER_CONFIGS.map((config, index) => {
  const id = index + 1;
  return {
    id,
    type: id <= 8 ? "melodic" : "drum",
    name: config.name,
    sample: {
      id: `starter-${String(id).padStart(2, "0")}`,
      name: config.name,
      sourceType: "starter",
      durationSeconds: config.durationSeconds,
      url: `/audio/starter/${config.file}`,
      mimeType: "audio/wav",
      rootMidi: config.rootMidi,
      gainCompensation: config.gainCompensation,
      chokeTargets: config.chokeTargets
    }
  };
});
