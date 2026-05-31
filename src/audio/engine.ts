import { createSchedulePlan as planProject, type SchedulePlanEntry, stepToToneTime } from "../domain/sequencer";
import type { Project } from "../domain/types";

type ToneModule = typeof import("tone");

export type { SchedulePlanEntry };

export function createSchedulePlan(project: Project): SchedulePlanEntry[] {
  return planProject(project);
}

export class NoteMakerAudioEngine {
  private tone: ToneModule | null = null;
  private synth: InstanceType<ToneModule["PolySynth"]> | null = null;
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
        const note = noteForEntry(entry);
        this.synth?.triggerAttackRelease(note, entry.durationSeconds, time, Math.min(entry.gain, 1));
      }, entry.toneTime);
      this.scheduledIds.push(scheduledId);
    }
    return plan;
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
    this.synth = null;
  }

  private clearSchedule(): void {
    if (!this.tone) return;
    this.scheduledIds.forEach((id) => this.tone?.Transport.clear(id));
    this.scheduledIds = [];
  }
}

function noteForEntry(entry: SchedulePlanEntry): string {
  if (entry.slotId >= 9) {
    return ["C2", "D2", "E2", "F2", "G2", "A2", "B2", "C3"][entry.slotId - 9] ?? "C2";
  }
  const scale = ["C3", "D3", "E3", "G3", "A3", "C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5", "A5", "C6"];
  return scale[entry.keyIndex - 1] ?? "C4";
}
