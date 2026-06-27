import type { SampleAsset, SlotType } from "./types";

type StarterSoundDefinition = {
  id: number;
  type: SlotType;
  name: string;
  sample: SampleAsset | null;
  isPlaceholder?: boolean;
};

type StarterConfig = {
  name: string;
  file: string;
  durationSeconds: number;
  rootMidi?: number;
  gainCompensation: number;
  chokeTargets?: number[];
  type?: SlotType;
  isPlaceholder?: boolean;
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
  { name: "Texture", file: "16-texture.wav", durationSeconds: 0.72, gainCompensation: 0.5 },
  { name: "Velvet Keys", file: "17-velvet-keys.wav", durationSeconds: 1.35, rootMidi: 60, gainCompensation: 0.58 },
  { name: "Tape Strings", file: "18-tape-strings.wav", durationSeconds: 1.6, rootMidi: 60, gainCompensation: 0.52 },
  { name: "Pocket Brass", file: "19-pocket-brass.wav", durationSeconds: 0.95, rootMidi: 60, gainCompensation: 0.62 },
  { name: "Bamboo Flute", file: "20-bamboo-flute.wav", durationSeconds: 1.2, rootMidi: 72, gainCompensation: 0.66 },
  { name: "Kalimba", file: "21-kalimba.wav", durationSeconds: 0.9, rootMidi: 72, gainCompensation: 0.68 },
  { name: "Sitar Pluck", file: "22-sitar-pluck.wav", durationSeconds: 1.05, rootMidi: 60, gainCompensation: 0.58 },
  { name: "Koto Pluck", file: "23-koto-pluck.wav", durationSeconds: 0.88, rootMidi: 67, gainCompensation: 0.62 },
  { name: "Choir Pad", file: "24-choir-pad.wav", durationSeconds: 1.8, rootMidi: 60, gainCompensation: 0.5 },
  { name: "Acid Bass", file: "25-acid-bass.wav", durationSeconds: 0.8, rootMidi: 36, gainCompensation: 0.72 },
  { name: "Sub Bass", file: "26-sub-bass.wav", durationSeconds: 1.2, rootMidi: 36, gainCompensation: 0.82 },
  { name: "Mallet", file: "27-mallet.wav", durationSeconds: 0.9, rootMidi: 72, gainCompensation: 0.68 },
  { name: "Marimba", file: "28-marimba.wav", durationSeconds: 1.0, rootMidi: 72, gainCompensation: 0.64 },
  { name: "Guitar Pluck", file: "29-guitar-pluck.wav", durationSeconds: 0.9, rootMidi: 64, gainCompensation: 0.62 },
  { name: "Lo Fi Piano", file: "30-lo-fi-piano.wav", durationSeconds: 1.35, rootMidi: 60, gainCompensation: 0.58 },
  { name: "Shimmer Pad", file: "31-shimmer-pad.wav", durationSeconds: 1.8, rootMidi: 60, gainCompensation: 0.46 },
  { name: "Vocal Chop", file: "32-vocal-chop.wav", durationSeconds: 0.72, rootMidi: 60, gainCompensation: 0.64 },
  { name: "808 Kick", file: "33-808-kick.wav", durationSeconds: 0.72, gainCompensation: 0.9, type: "drum" },
  { name: "Dusty Snare", file: "34-dusty-snare.wav", durationSeconds: 0.46, gainCompensation: 0.72, type: "drum" },
  { name: "Shaker", file: "35-shaker.wav", durationSeconds: 0.18, gainCompensation: 0.58, type: "drum" },
  { name: "Tambourine", file: "36-tambourine.wav", durationSeconds: 0.38, gainCompensation: 0.6, type: "drum" },
  { name: "Tabla Hit", file: "37-tabla-hit.wav", durationSeconds: 0.42, gainCompensation: 0.7, type: "drum" },
  { name: "Dhol Hit", file: "38-dhol-hit.wav", durationSeconds: 0.52, gainCompensation: 0.74, type: "drum" },
  { name: "Conga", file: "39-conga.wav", durationSeconds: 0.42, gainCompensation: 0.68, type: "drum" },
  { name: "Bongo", file: "40-bongo.wav", durationSeconds: 0.32, gainCompensation: 0.7, type: "drum" },
  { name: "Cowbell", file: "41-cowbell.wav", durationSeconds: 0.3, gainCompensation: 0.66, type: "drum" },
  { name: "Woodblock", file: "42-woodblock.wav", durationSeconds: 0.22, gainCompensation: 0.68, type: "drum" },
  { name: "Crash", file: "43-crash.wav", durationSeconds: 1.25, gainCompensation: 0.46, type: "drum" },
  { name: "Ride", file: "44-ride.wav", durationSeconds: 0.9, gainCompensation: 0.48, type: "drum" },
  { name: "Metal Hit", file: "45-metal-hit.wav", durationSeconds: 0.62, gainCompensation: 0.58, type: "drum" },
  { name: "Reverse Swell", file: "46-reverse-swell.wav", durationSeconds: 0.9, gainCompensation: 0.52, type: "drum" },
  { name: "Vinyl Dust", file: "47-vinyl-dust.wav", durationSeconds: 0.72, gainCompensation: 0.48, type: "drum" },
  { name: "Add Sound", file: "", durationSeconds: 0, gainCompensation: 1, isPlaceholder: true }
];

export const STARTER_SOUNDS: StarterSoundDefinition[] = STARTER_CONFIGS.map((config, index) => {
  const id = index + 1;
  const type = config.type ?? (id <= 8 || (id >= 17 && id <= 32) ? "melodic" : "drum");
  return {
    id,
    type,
    name: config.name,
    isPlaceholder: config.isPlaceholder,
    sample: config.isPlaceholder
      ? null
      : {
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
