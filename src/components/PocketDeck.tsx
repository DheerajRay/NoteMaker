import { INSTRUMENTS } from "../domain/instruments";
import type { InstrumentId, Project } from "../domain/types";
import type { SchedulePlanEntry } from "../audio/engine";

type PocketDeckProps = {
  project: Project;
  currentStep: number;
  playing: boolean;
  schedulePlan: SchedulePlanEntry[];
  selectedInstrumentId: InstrumentId;
  onSelectInstrument: (instrumentId: InstrumentId) => void;
  onSelectPattern: (patternIndex: number) => void;
};

const PATTERN_STEPS = 16;

export function PocketDeck({
  project,
  currentStep,
  playing,
  schedulePlan,
  selectedInstrumentId,
  onSelectInstrument,
  onSelectPattern
}: PocketDeckProps) {
  const patternCount = Math.ceil(project.steps / PATTERN_STEPS);
  const activePattern = Math.floor(currentStep / PATTERN_STEPS);
  const activeStepInPattern = currentStep % PATTERN_STEPS;
  const activeSteps = new Set(schedulePlan.map((entry) => entry.step % PATTERN_STEPS));
  const soundPads = INSTRUMENTS.flatMap((instrument) =>
    instrument.sounds.slice(0, 3).map((sound) => ({
      instrumentId: instrument.id,
      color: instrument.color,
      label: sound,
      title: instrument.shortName
    }))
  ).slice(0, 16);

  return (
    <section className="pocket-deck" aria-label="Pocket performance deck">
      <div className="pocket-face">
        <div className="pocket-screen" aria-live="polite">
          <span className={`run-dot ${playing ? "is-running" : ""}`} aria-hidden="true" />
          <div>
            <p className="lcd-label">PATTERN {activePattern + 1}</p>
            <strong>{String(activeStepInPattern + 1).padStart(2, "0")}</strong>
          </div>
          <div>
            <p className="lcd-label">BPM</p>
            <strong>{project.tempo}</strong>
          </div>
          <div>
            <p className="lcd-label">CHAIN</p>
            <strong>{Array.from({ length: patternCount }, (_, index) => String(index + 1).padStart(2, "0")).join("-")}</strong>
          </div>
        </div>

        <div className="step-leds" aria-label="16 step running lights">
          {Array.from({ length: PATTERN_STEPS }, (_, step) => (
            <span
              key={step}
              className={`step-led ${activeSteps.has(step) ? "has-note" : ""} ${
                step === activeStepInPattern ? "is-active" : ""
              }`}
              aria-label={`Step ${step + 1}${step === activeStepInPattern ? " is active" : ""}`}
            >
              {step + 1}
            </span>
          ))}
        </div>

        <div className="performance-grid" aria-label="16 sound pads">
          {soundPads.map((pad, index) => (
            <button
              type="button"
              key={`${pad.instrumentId}-${pad.label}-${index}`}
              className={`performance-pad ${pad.instrumentId === selectedInstrumentId ? "is-selected" : ""}`}
              style={{ "--accent": pad.color } as React.CSSProperties}
              onClick={() => onSelectInstrument(pad.instrumentId)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{pad.label}</strong>
              <small>{pad.title}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="pattern-bank" aria-label="Pattern bank">
        {Array.from({ length: patternCount }, (_, index) => (
          <button
            type="button"
            key={index}
            className={index === activePattern ? "is-selected" : ""}
            aria-pressed={index === activePattern}
            onClick={() => onSelectPattern(index)}
          >
            Pattern {index + 1}
          </button>
        ))}
      </div>
    </section>
  );
}
