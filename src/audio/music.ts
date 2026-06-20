export const PERFORMANCE_KEY_MIDI = [36, 39, 41, 43, 46, 48, 51, 53, 55, 58, 60, 63, 65, 67, 70, 72] as const;

export function playbackRateForKey(keyIndex: number, rootMidi: number, pitchSemitones: number): number {
  const safeIndex = Math.min(Math.max(Math.round(keyIndex), 1), PERFORMANCE_KEY_MIDI.length) - 1;
  const targetMidi = PERFORMANCE_KEY_MIDI[safeIndex] + pitchSemitones;
  return 2 ** ((targetMidi - rootMidi) / 12);
}
