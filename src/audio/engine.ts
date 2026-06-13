import { createSchedulePlan as planProject, type SchedulePlanEntry, stepToToneTime } from "../domain/sequencer";
import type { Project, SoundSlot } from "../domain/types";

type ToneModule = typeof import("tone");

export type { SchedulePlanEntry };

export function createSchedulePlan(project: Project): SchedulePlanEntry[] {
  return planProject(project);
}

export class NoteMakerAudioEngine {
  private tone: ToneModule | null = null;
  private synth: InstanceType<ToneModule["PolySynth"]> | null = null;
  private fmSynth: InstanceType<ToneModule["FMSynth"]> | null = null;
  private amSynth: InstanceType<ToneModule["AMSynth"]> | null = null;
  private pluckSynth: InstanceType<ToneModule["PluckSynth"]> | null = null;
  private drumSynth: InstanceType<ToneModule["MembraneSynth"]> | null = null;
  private noiseSynth: InstanceType<ToneModule["NoiseSynth"]> | null = null;
  private scheduledIds: number[] = [];

  async init(): Promise<void> {
    if (!this.tone) {
      this.tone = await import("tone");
    }
    await this.tone.start();
    if (!this.synth) {
      this.synth = new this.tone.PolySynth(this.tone.Synth, {
        volume: -8,
        envelope: { attack: 0.005, decay: 0.12, sustain: 0.18, release: 0.18 }
      }).toDestination();
    }
    if (!this.fmSynth) {
      this.fmSynth = new this.tone.FMSynth({
        volume: -10,
        harmonicity: 2.5,
        modulationIndex: 9,
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.22 }
      }).toDestination();
    }
    if (!this.amSynth) {
      this.amSynth = new this.tone.AMSynth({
        volume: -11,
        harmonicity: 1.5,
        envelope: { attack: 0.02, decay: 0.18, sustain: 0.16, release: 0.28 }
      }).toDestination();
    }
    if (!this.pluckSynth) {
      this.pluckSynth = new this.tone.PluckSynth({
        volume: -9,
        attackNoise: 0.8,
        dampening: 3200,
        resonance: 0.78
      }).toDestination();
    }
    if (!this.drumSynth) {
      this.drumSynth = new this.tone.MembraneSynth({
        volume: -5,
        envelope: { attack: 0.001, decay: 0.18, sustain: 0.02, release: 0.08 }
      }).toDestination();
    }
    if (!this.noiseSynth) {
      this.noiseSynth = new this.tone.NoiseSynth({
        volume: -10,
        envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.03 }
      }).toDestination();
    }
  }

  scheduleProject(project: Project): SchedulePlanEntry[] {
    if (!this.tone) return [];
    this.clearSchedule();
    this.tone.Transport.bpm.value = project.tempo;
    this.tone.Transport.loop = true;
    this.tone.Transport.loopStart = stepToToneTime(0);
    this.tone.Transport.loopEnd = stepToToneTime(16);

    const plan = createSchedulePlan(project);
    for (const entry of plan) {
      const scheduledId = this.tone.Transport.schedule((time) => {
        this.triggerEntry(entry, time);
      }, entry.toneTime);
      this.scheduledIds.push(scheduledId);
    }
    return plan;
  }

  async triggerPreview(project: Project, slotId: number, keyIndex: number): Promise<void> {
    await this.init();
    const slot = project.slots.find((candidate) => candidate.id === slotId);
    if (!slot) return;
    this.triggerSlot(slot, keyIndex, this.tone?.now() ?? 0, 0.92);
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
  }

  dispose(): void {
    this.clearSchedule();
    this.synth?.dispose();
    this.fmSynth?.dispose();
    this.amSynth?.dispose();
    this.pluckSynth?.dispose();
    this.drumSynth?.dispose();
    this.noiseSynth?.dispose();
    this.synth = null;
    this.fmSynth = null;
    this.amSynth = null;
    this.pluckSynth = null;
    this.drumSynth = null;
    this.noiseSynth = null;
  }

  private clearSchedule(): void {
    if (!this.tone) return;
    this.scheduledIds.forEach((id) => this.tone?.Transport.clear(id));
    this.scheduledIds = [];
  }

  private triggerEntry(entry: SchedulePlanEntry, time: number): void {
    const slotType = entry.slotId >= 9 ? "drum" : "melodic";
    this.triggerSlot({ id: entry.slotId, type: slotType } as SoundSlot, entry.keyIndex, time, Math.min(entry.gain, 1));
  }

  private triggerSlot(slot: SoundSlot, keyIndex: number, time: number, velocity: number): void {
    if (slot.type === "drum") {
      if (slot.id === 9) {
        this.drumSynth?.triggerAttackRelease("C1", "8n", time, velocity);
        return;
      }
      if (slot.id === 10) {
        this.noiseSynth?.triggerAttackRelease("12n", time, velocity * 0.85);
        this.drumSynth?.triggerAttackRelease("G1", "32n", time, velocity * 0.38);
        return;
      }
      if (slot.id === 11) {
        this.noiseSynth?.triggerAttackRelease("32n", time, velocity * 0.55);
        return;
      }
      if (slot.id === 12) {
        this.noiseSynth?.triggerAttackRelease("8n", time, velocity * 0.75);
        return;
      }
      if (slot.id === 13) {
        this.noiseSynth?.triggerAttackRelease("16n", time, velocity * 0.95);
        this.drumSynth?.triggerAttackRelease("D2", "64n", time, velocity * 0.22);
        return;
      }
      if (slot.id === 14) {
        this.drumSynth?.triggerAttackRelease("A2", "32n", time, velocity * 0.7);
        return;
      }
      if (slot.id === 15) {
        this.drumSynth?.triggerAttackRelease("F2", "16n", time, velocity * 0.68);
        return;
      }
      this.synth?.triggerAttackRelease(["C3", "G3"], 0.14, time, velocity * 0.38);
      return;
    }

    const note = noteForKey(keyIndex);
    if (slot.id === 1) {
      this.synth?.triggerAttackRelease(note, 0.3, time, velocity);
      return;
    }
    if (slot.id === 2) {
      this.amSynth?.triggerAttackRelease(note, 0.58, time, velocity * 0.82);
      this.synth?.triggerAttackRelease(transposeKey(keyIndex, 7), 0.48, time, velocity * 0.38);
      return;
    }
    if (slot.id === 3) {
      this.fmSynth?.triggerAttackRelease(transposeKey(keyIndex, 12), 0.2, time, velocity * 0.9);
      return;
    }
    if (slot.id === 4) {
      this.pluckSynth?.triggerAttackRelease(note, time, velocity * 0.85);
      return;
    }
    if (slot.id === 5) {
      this.amSynth?.triggerAttackRelease(transposeKey(keyIndex, -12), 0.72, time, velocity * 0.72);
      return;
    }
    if (slot.id === 6) {
      this.fmSynth?.triggerAttackRelease(note, 0.44, time, velocity * 0.58);
      this.synth?.triggerAttackRelease(transposeKey(keyIndex, 4), 0.44, time, velocity * 0.32);
      return;
    }
    if (slot.id === 7) {
      this.pluckSynth?.triggerAttackRelease(transposeKey(keyIndex, 19), time, velocity * 0.82);
      return;
    }
    this.synth?.triggerAttackRelease([note, transposeKey(keyIndex, 7), transposeKey(keyIndex, 12)], 0.34, time, velocity * 0.42);
  }
}

function noteForEntry(entry: SchedulePlanEntry): string {
  if (entry.slotId >= 9) {
    return ["C2", "D2", "E2", "F2", "G2", "A2", "B2", "C3"][entry.slotId - 9] ?? "C2";
  }
  return noteForKey(entry.keyIndex);
}

function noteForKey(keyIndex: number): string {
  const scale = ["C3", "D3", "E3", "G3", "A3", "C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5", "A5", "C6"];
  return scale[keyIndex - 1] ?? "C4";
}

function transposeKey(keyIndex: number, offset: number): string {
  const chromatic = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const note = noteForKey(keyIndex).match(/^([A-G]#?)(\d)$/);
  if (!note) return noteForKey(keyIndex);
  const baseIndex = chromatic.indexOf(note[1]);
  const midiLike = Number(note[2]) * 12 + baseIndex + offset;
  const octave = Math.floor(midiLike / 12);
  const pitch = chromatic[((midiLike % 12) + 12) % 12];
  return `${pitch}${octave}`;
}
