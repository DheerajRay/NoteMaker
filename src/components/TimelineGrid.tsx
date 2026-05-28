import { useDraggable, useDroppable } from "@dnd-kit/core";
import { getInstrument } from "../domain/instruments";
import type { PatternClip, Project } from "../domain/types";

type TimelineGridProps = {
  project: Project;
  onResizeClip: (clipId: string, deltaSteps: number) => void;
  onDuplicateClip: (clipId: string) => void;
  onRemoveClip: (clipId: string) => void;
  onToggleRepeat: (clipId: string) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
};

export function TimelineGrid({
  project,
  onResizeClip,
  onDuplicateClip,
  onRemoveClip,
  onToggleRepeat,
  onToggleMute,
  onToggleSolo
}: TimelineGridProps) {
  const steps = Array.from({ length: project.steps }, (_, index) => index);

  return (
    <section className="timeline-shell" aria-label="Arrangement timeline">
      <div className="map-overview" aria-hidden="true">
        {project.clips.map((clip) => (
          <span
            key={clip.id}
            style={{
              left: `${(clip.startStep / project.steps) * 100}%`,
              width: `${((clip.lengthSteps * clip.repeat) / project.steps) * 100}%`,
              background: getTrackColor(project, clip.trackId)
            }}
          />
        ))}
      </div>
      <div
        role="grid"
        aria-label={`${project.title} timeline`}
        className="timeline-grid"
        style={{ "--steps": project.steps } as React.CSSProperties}
      >
        <div className="track-corner">Paths</div>
        {steps.map((step) => (
          <div key={`header-${step}`} className="step-header">
            {step + 1}
          </div>
        ))}
        {project.tracks.map((track) => {
          const instrument = getInstrument(track.instrumentId);
          const clips = project.clips.filter((clip) => clip.trackId === track.id);

          return (
            <div className="track-row" role="row" key={track.id}>
              <div className="track-label" style={{ "--accent": instrument.color } as React.CSSProperties}>
                <span className="track-dot" aria-hidden="true" />
                <strong>{track.name}</strong>
                <small>{instrument.shortName}</small>
                <div className="track-actions">
                  <button type="button" aria-pressed={track.muted} onClick={() => onToggleMute(track.id)}>
                    Mute
                  </button>
                  <button type="button" aria-pressed={track.solo} onClick={() => onToggleSolo(track.id)}>
                    Solo
                  </button>
                </div>
              </div>
              <div className="track-cells">
                {steps.map((step) => (
                  <TimelineCell key={`${track.id}-${step}`} trackId={track.id} step={step} />
                ))}
                {clips.map((clip) => (
                  <ClipSticker
                    key={clip.id}
                    clip={clip}
                    project={project}
                    onResizeClip={onResizeClip}
                    onDuplicateClip={onDuplicateClip}
                    onRemoveClip={onRemoveClip}
                    onToggleRepeat={onToggleRepeat}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TimelineCell({ trackId, step }: { trackId: string; step: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${trackId}-${step}`,
    data: { type: "cell", trackId, step }
  });

  return (
    <div
      ref={setNodeRef}
      role="gridcell"
      className={`timeline-cell ${isOver ? "is-over" : ""}`}
      aria-label={`Step ${step + 1}`}
    />
  );
}

function ClipSticker({
  clip,
  project,
  onResizeClip,
  onDuplicateClip,
  onRemoveClip,
  onToggleRepeat
}: {
  clip: PatternClip;
  project: Project;
  onResizeClip: (clipId: string, deltaSteps: number) => void;
  onDuplicateClip: (clipId: string) => void;
  onRemoveClip: (clipId: string) => void;
  onToggleRepeat: (clipId: string) => void;
}) {
  const track = project.tracks.find((candidate) => candidate.id === clip.trackId);
  const instrument = getInstrument(track?.instrumentId ?? "drum-kit");
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `clip-${clip.id}`,
    data: { type: "clip", clipId: clip.id }
  });
  const widthSteps = Math.min(clip.lengthSteps * clip.repeat, project.steps - clip.startStep);

  return (
    <div
      ref={setNodeRef}
      className={`clip-sticker ${isDragging ? "is-dragging" : ""}`}
      aria-label={`${instrument.name} clip at step ${clip.startStep + 1}`}
      style={
        {
          "--start": clip.startStep + 1,
          "--span": widthSteps,
          "--accent": instrument.color,
          transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
        } as React.CSSProperties
      }
      {...listeners}
      {...attributes}
    >
      <div className="clip-title">
        <strong>{instrument.shortName}</strong>
        <span>x{clip.repeat}</span>
      </div>
      <div className="clip-actions">
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onResizeClip(clip.id, -1)}>
          -
        </button>
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onResizeClip(clip.id, 1)}>
          +
        </button>
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onToggleRepeat(clip.id)}>
          Repeat
        </button>
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onDuplicateClip(clip.id)}>
          Copy
        </button>
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onRemoveClip(clip.id)}>
          Remove
        </button>
      </div>
    </div>
  );
}

function getTrackColor(project: Project, trackId: string): string {
  const track = project.tracks.find((candidate) => candidate.id === trackId);
  return getInstrument(track?.instrumentId ?? "drum-kit").color;
}
