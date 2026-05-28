import type { Project } from "../domain/types";

type TransportBarProps = {
  project: Project;
  playing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onTempoChange: (tempo: number) => void;
  onLoopToggle: (enabled: boolean) => void;
  onLoopRangeChange: (startStep: number, endStep: number) => void;
};

export function TransportBar({
  project,
  playing,
  onPlay,
  onPause,
  onStop,
  onTempoChange,
  onLoopToggle,
  onLoopRangeChange
}: TransportBarProps) {
  return (
    <footer className="transport" aria-label="Transport and loop controls">
      <div className="transport-buttons">
        <button
          type="button"
          className="primary-action"
          aria-label={playing ? "Pause song" : "Play song"}
          onClick={playing ? onPause : onPlay}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button type="button" onClick={onStop}>
          Stop
        </button>
      </div>
      <label className="control-field">
        <span>Tempo</span>
        <input
          aria-label="Tempo"
          type="number"
          min={60}
          max={180}
          value={project.tempo}
          onChange={(event) => onTempoChange(Number(event.target.value))}
        />
      </label>
      <label className="toggle-field">
        <input
          type="checkbox"
          checked={project.loop.enabled}
          onChange={(event) => onLoopToggle(event.target.checked)}
        />
        Loop
      </label>
      <label className="control-field">
        <span>Start</span>
        <input
          aria-label="Loop start step"
          type="number"
          min={0}
          max={project.steps - 1}
          value={project.loop.startStep}
          onChange={(event) => onLoopRangeChange(Number(event.target.value), project.loop.endStep)}
        />
      </label>
      <label className="control-field">
        <span>End</span>
        <input
          aria-label="Loop end step"
          type="number"
          min={1}
          max={project.steps}
          value={project.loop.endStep}
          onChange={(event) => onLoopRangeChange(project.loop.startStep, Number(event.target.value))}
        />
      </label>
    </footer>
  );
}
