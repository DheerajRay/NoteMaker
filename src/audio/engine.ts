import { createSchedulePlan as planProject, type SchedulePlanEntry, stepToToneTime } from "../domain/sequencer";
import type { Project, SampleAsset, SoundSlot } from "../domain/types";
import { loadImportedAudio } from "./sampleStore";
import { playbackRateForKey } from "./music";

type ToneModule = typeof import("tone");

type ActiveVoice = {
  source: AudioBufferSourceNode;
  gain: GainNode;
  slotId: number;
};

export type VoicePlan = {
  offsetSeconds: number;
  sourceDurationSeconds: number;
  playbackRate: number;
  gain: number;
  filterFrequency: number;
  resonanceQ: number;
};

export type { SchedulePlanEntry };

export function createSchedulePlan(project: Project): SchedulePlanEntry[] {
  return planProject(project);
}

export function resolveTriggerStartTime(scheduledTime: number, currentToneTime: number, previousStartTime = Number.NEGATIVE_INFINITY): number {
  const minimumLeadTime = 0.005;
  return Math.max(scheduledTime, currentToneTime + minimumLeadTime, previousStartTime + minimumLeadTime);
}

export function filterFrequencyForValue(value: number): number {
  const normalized = clamp(value, 0, 1);
  return 120 * (18000 / 120) ** normalized;
}

export function resonanceForValue(value: number): number {
  return 0.2 + clamp(value, 0, 1) * 11.8;
}

export function createVoicePlan(entry: SchedulePlanEntry, bufferDuration: number): VoicePlan {
  const trimStart = clamp(entry.trimStart, 0, 1);
  const trimEnd = clamp(entry.trimEnd, trimStart, 1);
  return {
    offsetSeconds: bufferDuration * trimStart,
    sourceDurationSeconds: Math.max(bufferDuration * (trimEnd - trimStart), 0.005),
    playbackRate: Math.max(entry.playbackRate, 0.01),
    gain: clamp(entry.gain, 0, 1.5),
    filterFrequency: filterFrequencyForValue(entry.filter),
    resonanceQ: resonanceForValue(entry.resonance)
  };
}

export class NoteMakerAudioEngine {
  private tone: ToneModule | null = null;
  private context: AudioContext | null = null;
  private melodicBus: GainNode | null = null;
  private drumBus: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private scheduledIds: number[] = [];
  private buffers = new Map<string, AudioBuffer>();
  private activeVoices = new Map<number, ActiveVoice[]>();

  async init(): Promise<void> {
    if (!this.tone) this.tone = await import("tone");
    await this.tone.start();
    if (!this.context) {
      this.context = this.tone.getContext().rawContext as AudioContext;
      this.createMixGraph();
    }
  }

  async scheduleProject(project: Project): Promise<SchedulePlanEntry[]> {
    await this.init();
    const plan = createSchedulePlan(project);
    await this.prepareAssets(project, plan);
    this.clearSchedule();
    if (!this.tone) return [];

    this.tone.Transport.bpm.value = project.tempo;
    this.tone.Transport.loop = true;
    this.tone.Transport.loopStart = stepToToneTime(0);
    this.tone.Transport.loopEnd = "1:0:0";

    for (const entry of plan) {
      const scheduledId = this.tone.Transport.schedule((time) => this.triggerEntry(entry, time), entry.toneTime);
      this.scheduledIds.push(scheduledId);
    }
    return plan;
  }

  async triggerPreview(project: Project, slotId: number, keyIndex: number): Promise<void> {
    await this.init();
    const slot = project.slots.find((candidate) => candidate.id === slotId);
    if (!slot?.sample || !this.context) return;
    const buffer = await this.loadSample(slot.sample);
    const entry = previewEntry(project, slot, keyIndex);
    this.triggerVoice(entry, buffer, this.context.currentTime + 0.005);
  }

  async play(): Promise<void> {
    await this.init();
    this.tone?.Transport.start("+0.05");
  }

  pause(): void {
    this.tone?.Transport.pause();
  }

  stop(): void {
    this.tone?.Transport.stop();
    if (this.tone) this.tone.Transport.position = 0;
    this.stopAllVoices();
  }

  getMasterLevel(): number {
    if (!this.analyser) return 0;
    const samples = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(samples);
    const sum = samples.reduce((total, sample) => total + sample * sample, 0);
    return Math.sqrt(sum / samples.length);
  }

  dispose(): void {
    this.clearSchedule();
    this.stopAllVoices();
    this.melodicBus?.disconnect();
    this.drumBus?.disconnect();
    this.masterGain?.disconnect();
    this.limiter?.disconnect();
    this.analyser?.disconnect();
    this.buffers.clear();
    this.context = null;
    this.melodicBus = null;
    this.drumBus = null;
    this.masterGain = null;
    this.limiter = null;
    this.analyser = null;
  }

  private createMixGraph(): void {
    if (!this.context) return;
    this.melodicBus = this.context.createGain();
    this.drumBus = this.context.createGain();
    this.masterGain = this.context.createGain();
    this.limiter = this.context.createDynamicsCompressor();
    this.analyser = this.context.createAnalyser();

    this.melodicBus.gain.value = 0.58;
    this.drumBus.gain.value = 0.64;
    this.masterGain.gain.value = 0.78;
    this.limiter.threshold.value = -6;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.12;
    this.analyser.fftSize = 256;

    this.melodicBus.connect(this.masterGain);
    this.drumBus.connect(this.masterGain);
    this.masterGain.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.analyser.connect(this.context.destination);
  }

  private async prepareAssets(project: Project, plan: SchedulePlanEntry[]): Promise<void> {
    const sampleIds = new Set(plan.map((entry) => entry.sampleId));
    const samples = project.slots
      .map((slot) => slot.sample)
      .filter((sample): sample is SampleAsset => Boolean(sample && sampleIds.has(sample.id)));
    await Promise.all(samples.map((sample) => this.loadSample(sample)));
  }

  private async loadSample(sample: SampleAsset): Promise<AudioBuffer> {
    const cached = this.buffers.get(sample.id);
    if (cached) return cached;
    if (!this.context) throw new Error("Audio is not initialized.");

    let bytes: ArrayBuffer;
    if (sample.sourceType === "starter") {
      if (!sample.url) throw new Error(`Starter sound ${sample.name} has no asset URL.`);
      const response = await fetch(sample.url);
      if (!response.ok) throw new Error(`Could not load starter sound ${sample.name}.`);
      bytes = await response.arrayBuffer();
    } else {
      const stored = await loadImportedAudio(sample.id);
      if (!stored) throw new Error(`Imported sound ${sample.name} is unavailable on this device.`);
      bytes = stored.bytes;
    }

    const buffer = await this.context.decodeAudioData(bytes.slice(0));
    this.buffers.set(sample.id, buffer);
    return buffer;
  }

  private clearSchedule(): void {
    if (!this.tone) return;
    this.scheduledIds.forEach((id) => this.tone?.Transport.clear(id));
    this.scheduledIds = [];
  }

  private triggerEntry(entry: SchedulePlanEntry, time: number): void {
    const buffer = this.buffers.get(entry.sampleId);
    if (!buffer || !this.context) return;
    this.triggerVoice(entry, buffer, Math.max(time, this.context.currentTime + 0.005));
  }

  private triggerVoice(entry: SchedulePlanEntry, buffer: AudioBuffer, startTime: number): void {
    if (!this.context) return;
    entry.chokeTargets.forEach((slotId) => this.stopSlotVoices(slotId, startTime));
    this.enforceVoiceLimit(entry.slotId, startTime);

    const plan = createVoicePlan(entry, buffer.duration);
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const destination = entry.slotType === "drum" ? this.drumBus : this.melodicBus;
    if (!destination) return;

    source.buffer = buffer;
    source.playbackRate.setValueAtTime(plan.playbackRate, startTime);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(plan.filterFrequency, startTime);
    filter.Q.setValueAtTime(plan.resonanceQ, startTime);

    const audibleDuration = plan.sourceDurationSeconds / plan.playbackRate;
    const releaseStart = startTime + Math.max(audibleDuration - 0.008, 0.003);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(plan.gain, 0.0002), startTime + 0.003);
    gain.gain.setValueAtTime(Math.max(plan.gain, 0.0002), releaseStart);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + audibleDuration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    const voice: ActiveVoice = { source, gain, slotId: entry.slotId };
    const voices = this.activeVoices.get(entry.slotId) ?? [];
    voices.push(voice);
    this.activeVoices.set(entry.slotId, voices);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      this.activeVoices.set(entry.slotId, (this.activeVoices.get(entry.slotId) ?? []).filter((candidate) => candidate !== voice));
    };
    source.start(startTime, plan.offsetSeconds, plan.sourceDurationSeconds);
  }

  private enforceVoiceLimit(slotId: number, time: number): void {
    const voices = this.activeVoices.get(slotId) ?? [];
    if (voices.length < 8) return;
    this.releaseVoice(voices[0], time);
  }

  private stopSlotVoices(slotId: number, time: number): void {
    (this.activeVoices.get(slotId) ?? []).forEach((voice) => this.releaseVoice(voice, time));
  }

  private releaseVoice(voice: ActiveVoice, time: number): void {
    try {
      voice.gain.gain.cancelScheduledValues(time);
      voice.gain.gain.setTargetAtTime(0.0001, time, 0.003);
      voice.source.stop(time + 0.015);
    } catch {
      // The voice may already have ended between scheduling and cleanup.
    }
  }

  private stopAllVoices(): void {
    const time = this.context?.currentTime ?? 0;
    this.activeVoices.forEach((voices) => voices.forEach((voice) => this.releaseVoice(voice, time)));
    this.activeVoices.clear();
  }
}

function previewEntry(project: Project, slot: SoundSlot, keyIndex: number): SchedulePlanEntry {
  const sample = slot.sample!;
  return {
    patternId: project.activePatternId,
    stepIndex: 0,
    slotId: slot.id,
    keyIndex,
    sampleId: sample.id,
    sampleName: sample.name,
    slotType: slot.type,
    toneTime: "0:0:0",
    seconds: 0,
    durationSeconds: sample.durationSeconds,
    trimStart: slot.trimStart,
    trimEnd: slot.trimEnd,
    gain: slot.gain * 0.92 * (sample.gainCompensation ?? 1),
    playbackRate: slot.type === "melodic"
      ? playbackRateForKey(keyIndex, sample.rootMidi ?? 60, slot.pitch)
      : 2 ** (slot.pitch / 12),
    filter: slot.filter,
    resonance: slot.resonance,
    chokeTargets: sample.chokeTargets ?? []
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
