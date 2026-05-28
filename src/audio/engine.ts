import { soundToNote } from "../domain/instruments";
import { expandProjectEvents, stepToSeconds, stepToToneTime } from "../domain/sequencer";
import type { InstrumentId, Project } from "../domain/types";

export type SchedulePlanEntry = {
  clipId: string;
  trackId: string;
  instrumentId: InstrumentId;
  sound: string;
  note: string;
  step: number;
  toneTime: string;
  seconds: number;
  durationSeconds: number;
  velocity: number;
};

type ToneModule = typeof import("tone");

export function createSchedulePlan(project: Project): SchedulePlanEntry[] {
  return expandProjectEvents(project).map((event) => ({
    ...event,
    note: soundToNote(event.instrumentId, event.sound),
    toneTime: stepToToneTime(event.step),
    seconds: stepToSeconds(event.step, project.tempo),
    durationSeconds: Math.max(stepToSeconds(event.durationSteps, project.tempo), 0.08)
  }));
}

export class NoteMakerAudioEngine {
  private tone: ToneModule | null = null;
  private synths = new Map<InstrumentId, InstanceType<ToneModule["PolySynth"]>>();
  private scheduledIds: number[] = [];

  async init(): Promise<void> {
    if (!this.tone) {
      this.tone = await import("tone");
    }
    await this.tone.start();
  }

  loadInstrument(instrumentId: InstrumentId): void {
    if (!this.tone || this.synths.has(instrumentId)) return;
    const synth = new this.tone.PolySynth(this.tone.Synth, {
      volume: instrumentId === "pad" ? -14 : -8,
      envelope: instrumentId === "pad"
        ? { attack: 0.35, decay: 0.3, sustain: 0.75, release: 1.4 }
        : { attack: 0.01, decay: 0.18, sustain: 0.25, release: 0.22 }
    }).toDestination();
    this.synths.set(instrumentId, synth);
  }

  scheduleProject(project: Project): SchedulePlanEntry[] {
    if (!this.tone) return [];
    this.clearSchedule();
    this.tone.Transport.bpm.value = project.tempo;
    this.tone.Transport.loop = project.loop.enabled;
    this.tone.Transport.loopStart = stepToToneTime(project.loop.startStep);
    this.tone.Transport.loopEnd = stepToToneTime(project.loop.endStep);

    const plan = createSchedulePlan(project);
    for (const entry of plan) {
      this.loadInstrument(entry.instrumentId);
      const scheduledId = this.tone.Transport.schedule((time) => {
        const synth = this.synths.get(entry.instrumentId);
        synth?.triggerAttackRelease(entry.note, entry.durationSeconds, time, entry.velocity);
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

  setTempo(tempo: number): void {
    if (this.tone) this.tone.Transport.bpm.value = tempo;
  }

  setLoop(startStep: number, endStep: number): void {
    if (!this.tone) return;
    this.tone.Transport.loopStart = stepToToneTime(startStep);
    this.tone.Transport.loopEnd = stepToToneTime(endStep);
  }

  dispose(): void {
    this.clearSchedule();
    this.synths.forEach((synth) => synth.dispose());
    this.synths.clear();
  }

  private clearSchedule(): void {
    if (!this.tone) return;
    this.scheduledIds.forEach((id) => this.tone?.Transport.clear(id));
    this.scheduledIds = [];
  }
}
