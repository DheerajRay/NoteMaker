export const PERFORMANCE_KEY_MIDI = [36, 39, 41, 43, 46, 48, 51, 53, 55, 58, 60, 63, 65, 67, 70, 72] as const;

export type DrumVariation = {
  label: string;
  pitchSemitones: number;
  filterScale: number;
  durationScale: number;
  gainScale: number;
};

export const DRUM_KEY_VARIATIONS: DrumVariation[] = [
  { label: "Sub", pitchSemitones: -12, filterScale: 0.34, durationScale: 1.08, gainScale: 0.98 },
  { label: "Low", pitchSemitones: -8, filterScale: 0.44, durationScale: 1, gainScale: 1 },
  { label: "Deep", pitchSemitones: -5, filterScale: 0.54, durationScale: 0.94, gainScale: 1.02 },
  { label: "Dark", pitchSemitones: -2, filterScale: 0.64, durationScale: 0.86, gainScale: 0.98 },
  { label: "Soft", pitchSemitones: -1, filterScale: 0.72, durationScale: 0.98, gainScale: 0.82 },
  { label: "Clean", pitchSemitones: 0, filterScale: 0.84, durationScale: 0.9, gainScale: 1 },
  { label: "Punch", pitchSemitones: 1, filterScale: 0.92, durationScale: 0.8, gainScale: 1.08 },
  { label: "Short", pitchSemitones: 2, filterScale: 1, durationScale: 0.68, gainScale: 0.96 },
  { label: "Bright", pitchSemitones: 3, filterScale: 0.8, durationScale: 0.62, gainScale: 0.96 },
  { label: "Tight", pitchSemitones: 5, filterScale: 0.88, durationScale: 0.52, gainScale: 0.94 },
  { label: "Snap", pitchSemitones: 7, filterScale: 0.96, durationScale: 0.42, gainScale: 0.92 },
  { label: "Tick", pitchSemitones: 9, filterScale: 1, durationScale: 0.34, gainScale: 0.86 },
  { label: "Boom", pitchSemitones: -12, filterScale: 0.28, durationScale: 1.16, gainScale: 1.08 },
  { label: "Knock", pitchSemitones: -4, filterScale: 0.56, durationScale: 0.48, gainScale: 1.1 },
  { label: "Clip", pitchSemitones: 7, filterScale: 0.9, durationScale: 0.28, gainScale: 0.94 },
  { label: "Chip", pitchSemitones: 12, filterScale: 1, durationScale: 0.2, gainScale: 0.82 }
];

export function playbackRateForKey(keyIndex: number, rootMidi: number, pitchSemitones: number): number {
  const safeIndex = Math.min(Math.max(Math.round(keyIndex), 1), PERFORMANCE_KEY_MIDI.length) - 1;
  const targetMidi = PERFORMANCE_KEY_MIDI[safeIndex] + pitchSemitones;
  return 2 ** ((targetMidi - rootMidi) / 12);
}

export function drumVariationForKey(keyIndex: number): DrumVariation {
  const safeIndex = Math.min(Math.max(Math.round(keyIndex), 1), DRUM_KEY_VARIATIONS.length) - 1;
  return DRUM_KEY_VARIATIONS[safeIndex];
}

export function playbackRateForDrumKey(keyIndex: number, slotId: number, pitchSemitones: number): number {
  const variation = drumVariationForKey(keyIndex);
  const scaledVariationPitch = Math.round(variation.pitchSemitones * drumPitchScaleForSlot(slotId));
  return 2 ** ((pitchSemitones + scaledVariationPitch) / 12);
}

function drumPitchScaleForSlot(slotId: number): number {
  if (slotId === 9) return 1;
  if (slotId === 11 || slotId === 12) return 0.5;
  if (slotId === 13) return 0.6;
  if (slotId === 10 || slotId === 14) return 0.72;
  if (slotId === 15) return 0.9;
  return 0.8;
}
