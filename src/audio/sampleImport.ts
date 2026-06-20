import { createId } from "../domain/project";
import type { SampleAsset } from "../domain/types";
import { saveImportedAudio, type StoredAudioAsset } from "./sampleStore";

type ImportDependencies = {
  decodeDuration: (bytes: ArrayBuffer) => Promise<number>;
  save: (asset: StoredAudioAsset) => Promise<void>;
  createId: () => string;
};

const DEFAULT_DEPENDENCIES: ImportDependencies = {
  decodeDuration: decodeAudioDuration,
  save: saveImportedAudio,
  createId: () => createId("sample")
};

export async function importAudioFile(
  file: File,
  dependencies: ImportDependencies = DEFAULT_DEPENDENCIES
): Promise<SampleAsset> {
  if (!file.type.startsWith("audio/")) {
    throw new Error("Choose an audio file for this slot.");
  }

  const bytes = await file.arrayBuffer();
  let durationSeconds: number;
  try {
    durationSeconds = await dependencies.decodeDuration(bytes.slice(0));
  } catch {
    throw new Error("This audio file could not be decoded.");
  }

  const id = dependencies.createId();
  const name = file.name.replace(/\.[^.]+$/, "") || "Imported Sound";
  await dependencies.save({ id, name, mimeType: file.type, durationSeconds, bytes });

  return {
    id,
    name,
    sourceType: "imported",
    durationSeconds,
    mimeType: file.type,
    originalFileName: file.name,
    gainCompensation: 0.72
  };
}

async function decodeAudioDuration(bytes: ArrayBuffer): Promise<number> {
  const AudioContextConstructor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) throw new Error("Web Audio is unavailable.");
  const context = new AudioContextConstructor();
  try {
    const buffer = await context.decodeAudioData(bytes);
    return buffer.duration;
  } finally {
    await context.close();
  }
}
