import type { InstrumentId, InstrumentPreset, StepEvent } from "./types";

export const INSTRUMENTS: InstrumentPreset[] = [
  {
    id: "drum-kit",
    name: "Pocket Drums",
    shortName: "Drums",
    description: "Kick, snare, clap, and hat for simple beats.",
    color: "#f58f8f",
    sounds: ["kick", "snare", "hat", "clap"]
  },
  {
    id: "bass",
    name: "Bumble Bass",
    shortName: "Bass",
    description: "Soft low notes that carry the song.",
    color: "#8fc7a4",
    sounds: ["C2", "D2", "E2", "G2"]
  },
  {
    id: "keys",
    name: "Puddle Keys",
    shortName: "Keys",
    description: "Warm piano-like notes for chords and patterns.",
    color: "#9eb7f1",
    sounds: ["C4", "E4", "G4", "B4"]
  },
  {
    id: "bells",
    name: "Story Bells",
    shortName: "Bells",
    description: "Bright small notes for melodies.",
    color: "#f6c86f",
    sounds: ["C5", "D5", "G5", "A5"]
  },
  {
    id: "pluck",
    name: "Pebble Pluck",
    shortName: "Pluck",
    description: "Short plucked sounds for playful rhythms.",
    color: "#d6a4ec",
    sounds: ["C3", "E3", "A3", "C4"]
  },
  {
    id: "pad",
    name: "Cloud Pad",
    shortName: "Pad",
    description: "Long background sounds for atmosphere.",
    color: "#91d9df",
    sounds: ["C3", "F3", "G3", "A3"]
  }
];

export function getInstrument(id: InstrumentId): InstrumentPreset {
  const instrument = INSTRUMENTS.find((candidate) => candidate.id === id);
  if (!instrument) {
    throw new Error(`Unknown instrument: ${id}`);
  }
  return instrument;
}

export function createStarterEvents(instrumentId: InstrumentId): StepEvent[] {
  switch (instrumentId) {
    case "drum-kit":
      return [
        { step: 0, sound: "kick", velocity: 0.9, durationSteps: 1 },
        { step: 2, sound: "hat", velocity: 0.45, durationSteps: 1 },
        { step: 4, sound: "snare", velocity: 0.75, durationSteps: 1 },
        { step: 6, sound: "hat", velocity: 0.45, durationSteps: 1 }
      ];
    case "pad":
      return [{ step: 0, sound: "C3", velocity: 0.5, durationSteps: 8 }];
    case "bass":
      return [
        { step: 0, sound: "C2", velocity: 0.72, durationSteps: 2 },
        { step: 4, sound: "G2", velocity: 0.66, durationSteps: 2 }
      ];
    default: {
      const instrument = getInstrument(instrumentId);
      return [
        { step: 0, sound: instrument.sounds[0], velocity: 0.72, durationSteps: 1 },
        { step: 2, sound: instrument.sounds[1], velocity: 0.62, durationSteps: 1 },
        { step: 4, sound: instrument.sounds[2], velocity: 0.68, durationSteps: 1 }
      ];
    }
  }
}

export function soundToNote(instrumentId: InstrumentId, sound: string): string {
  if (instrumentId !== "drum-kit") return sound;
  const drumMap: Record<string, string> = {
    kick: "C2",
    snare: "D2",
    hat: "F#2",
    clap: "E2"
  };
  return drumMap[sound] ?? "C2";
}
