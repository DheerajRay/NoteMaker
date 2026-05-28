import type { Project, ScheduledEvent } from "./types";

export const STEPS_PER_BAR = 4;
export const SIXTEENTH_NOTES_PER_STEP = 1;

export function stepToToneTime(step: number): string {
  const bar = Math.floor(step / STEPS_PER_BAR);
  const beat = step % STEPS_PER_BAR;
  return `${bar}:${beat}:0`;
}

export function stepToSeconds(step: number, tempo: number): number {
  const secondsPerBeat = 60 / tempo;
  return step * secondsPerBeat * SIXTEENTH_NOTES_PER_STEP;
}

export function quantizeStep(step: number, totalSteps: number): number {
  return Math.min(Math.max(Math.round(step), 0), totalSteps - 1);
}

export function expandProjectEvents(project: Project): ScheduledEvent[] {
  const audibleTracks = getAudibleTracks(project);
  const tracksById = new Map(audibleTracks.map((track) => [track.id, track]));
  const trackOrder = new Map(project.tracks.map((track, index) => [track.id, index]));
  const events: ScheduledEvent[] = [];

  for (const clip of project.clips) {
    const track = tracksById.get(clip.trackId);
    if (!track) continue;

    for (let cycle = 0; cycle < Math.max(clip.repeat, 1); cycle += 1) {
      const cycleOffset = clip.startStep + cycle * clip.lengthSteps;
      for (const event of clip.events) {
        const step = cycleOffset + event.step;
        if (step >= project.steps) continue;
        if (project.loop.enabled && (step < project.loop.startStep || step >= project.loop.endStep)) continue;
        events.push({
          clipId: clip.id,
          trackId: track.id,
          instrumentId: track.instrumentId,
          sound: event.sound,
          step,
          durationSteps: event.durationSteps,
          velocity: event.velocity
        });
      }
    }
  }

  return events.sort(
    (a, b) => a.step - b.step || (trackOrder.get(a.trackId) ?? 0) - (trackOrder.get(b.trackId) ?? 0)
  );
}

function getAudibleTracks(project: Project) {
  const soloed = project.tracks.filter((track) => track.solo);
  if (soloed.length > 0) return soloed.filter((track) => !track.muted);
  return project.tracks.filter((track) => !track.muted);
}
