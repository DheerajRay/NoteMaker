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
    this.drumSynth?.dispose();
    this.noiseSynth?.dispose();
    this.synth = null;
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
      if (slot.id === 12) {
        this.noiseSynth?.triggerAttackRelease("8n", time, velocity * 0.75);
        return;
      }
      this.noiseSynth?.triggerAttackRelease("16n", time, velocity * 0.7);
      return;
    }

    this.synth?.triggerAttackRelease(noteForKey(keyIndex), 0.24, time, velocity);
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
