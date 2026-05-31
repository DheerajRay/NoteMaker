import { useState } from "react";
import { parseProject } from "../domain/project";
import { createSchedulePlan } from "../domain/sequencer";
import type { ParamMode, Project, SoundSlot } from "../domain/types";

type Po33DeviceProps = {
  project: Project;
  selectedKeyIndex: number;
  currentStep: number;
  playing: boolean;
  importError: string | null;
  onSelectSlot: (slotId: number) => void;
  onSelectPattern: (patternId: number) => void;
  onSelectKey: (keyIndex: number) => void;
  onToggleWrite: () => void;
  onToggleStep: (stepIndex: number) => void;
  onTempoChange: (tempo: number) => void;
  onParamModeChange: (mode: ParamMode) => void;
  onKnobChange: (knob: "a" | "b", value: number) => void;
  onImportSample: (file: File | undefined) => void;
  onImportProject: (project: Project) => void;
  onExportProject: () => void;
  onResetProject: () => void;
  onPlay: () => void;
  onStop: () => void;
};

const PARAM_MODES: ParamMode[] = ["trim", "tone", "filter"];

export function Po33Device({
  project,
  selectedKeyIndex,
  currentStep,
  playing,
  importError,
  onSelectSlot,
  onSelectPattern,
  onSelectKey,
  onToggleWrite,
  onToggleStep,
  onTempoChange,
  onParamModeChange,
  onKnobChange,
  onImportSample,
  onImportProject,
  onExportProject,
  onResetProject,
  onPlay,
  onStop
}: Po33DeviceProps) {
  const activeSlot = project.slots.find((slot) => slot.id === project.activeSlotId) ?? project.slots[0];
  const activePattern = project.patterns.find((pattern) => pattern.id === project.activePatternId) ?? project.patterns[0];
  const activeStep = activePattern.steps[currentStep] ?? activePattern.steps[0];
  const scheduledCount = createSchedulePlan(project).length;
  const [guideOpen, setGuideOpen] = useState(false);

  async function handleProjectImport(file: File | undefined) {
    if (!file) return;
    onImportProject(parseProject(await file.text()));
  }

  return (
    <main className="po33-app">
      <section className="device-shell" aria-label="PO33-style NoteMaker instrument">
        <header className="device-header">
          <div>
            <p className="device-eyebrow">original browser sampler</p>
            <h1>NoteMaker</h1>
          </div>
          <div className="transport-cluster">
            <button type="button" className="help-key" aria-label="Open tool guide" onClick={() => setGuideOpen(true)}>
              i
            </button>
            <button type="button" className="transport-key" aria-label={playing ? "Stop playback" : "Play pattern"} onClick={playing ? onStop : onPlay}>
              {playing ? "stop" : "play"}
            </button>
            <button type="button" className="transport-key" aria-label="Reset project" onClick={onResetProject}>
              reset
            </button>
          </div>
        </header>

        <section className="lcd" aria-label="LCD status">
          <ActionAnimationBar
            actionText={getActionText({
              activePattern,
              activeSlotId: project.activeSlotId,
              currentStep,
              playing,
              selectedKeyIndex,
              writeMode: project.writeMode
            })}
            activeStepIndex={currentStep}
            activeSlotId={project.activeSlotId}
          />
          <span className={`run-light ${playing ? "is-on" : ""}`} aria-hidden="true" />
          <PixelSampler playing={playing} stepIndex={activeStep.index} />
          <LcdCell label="pattern" value={format2(project.activePatternId)} />
          <LcdCell label="slot" value={format2(project.activeSlotId)} />
          <LcdCell label="step" value={format2(currentStep + 1)} />
          <LcdCell label="bpm" value={String(project.tempo)} />
          <LcdCell label="write" value={project.writeMode ? "on" : "off"} />
          <LcdCell label="events" value={String(scheduledCount)} />
        </section>

        <div className="machine-grid">
          <section className="sequencer-bank" aria-label="Step sequencer">
            <div className="step-led-bank" aria-label="16 step LEDs">
              {activePattern.steps.map((step) => {
                const hasSelectedTrigger = step.triggers.some((trigger) => trigger.slotId === project.activeSlotId);
                const isCurrent = step.index === currentStep;
                return (
                  <button
                    type="button"
                    key={step.index}
                    className={`step-key ${hasSelectedTrigger ? "has-trigger" : ""} ${isCurrent ? "is-current" : ""}`}
                    aria-label={`Step ${format2(step.index + 1)}`}
                    aria-pressed={hasSelectedTrigger}
                    onClick={() => onToggleStep(step.index)}
                  >
                    {step.index + 1}
                  </button>
                );
              })}
            </div>

            <div className="mode-row" aria-label="Mode controls">
              <button type="button" aria-label="Write mode" aria-pressed={project.writeMode} onClick={onToggleWrite}>
                write
              </button>
              {PARAM_MODES.map((mode) => (
                <button
                  type="button"
                  key={mode}
                  aria-pressed={project.paramMode === mode}
                  onClick={() => onParamModeChange(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="knob-row" aria-label="Parameter knobs">
              <Knob slot={activeSlot} knob="a" mode={project.paramMode} onChange={onKnobChange} />
              <Knob slot={activeSlot} knob="b" mode={project.paramMode} onChange={onKnobChange} />
            </div>
          </section>

          <section className="slot-bank" aria-label="16 sound slots">
            {project.slots.map((slot) => (
              <button
                type="button"
                key={slot.id}
                className={`slot-pad ${slot.id === project.activeSlotId ? "is-selected" : ""}`}
                aria-label={`Slot ${format2(slot.id)} ${slot.name} ${slot.type}`}
                aria-pressed={slot.id === project.activeSlotId}
                onClick={() => onSelectSlot(slot.id)}
              >
                <span>{format2(slot.id)}</span>
                <strong>{slot.name}</strong>
                <small>{slot.type}</small>
              </button>
            ))}
          </section>
        </div>

        <section className="key-bank" aria-label="16 performance keys">
          {Array.from({ length: 16 }, (_, index) => (
            <button
              type="button"
              key={index}
              aria-label={`Key ${format2(index + 1)}`}
              aria-pressed={selectedKeyIndex === index + 1}
              onClick={() => onSelectKey(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </section>

        <section className="lower-panel">
          <div className="pattern-bank" aria-label="Pattern bank">
            {project.patterns.map((pattern) => (
              <button
                type="button"
                key={pattern.id}
                aria-label={`Pattern ${format2(pattern.id)}`}
                aria-pressed={pattern.id === project.activePatternId}
                onClick={() => onSelectPattern(pattern.id)}
              >
                {format2(pattern.id)}
              </button>
            ))}
          </div>

          <div className="slot-editor" aria-label="Selected slot details">
            <div>
              <p className="device-eyebrow">selected sound</p>
              <h2>{format2(activeSlot.id)} {activeSlot.name}</h2>
              <p>{activeSlot.sample ? `${activeSlot.sample.sourceType} sample, ${activeSlot.sample.durationSeconds.toFixed(2)}s` : "empty slot"}</p>
              {importError ? <p className="error-text">{importError}</p> : null}
            </div>
            <label className="file-control">
              import sound
              <input type="file" accept="audio/*" onChange={(event) => onImportSample(event.target.files?.[0])} />
            </label>
            <label className="file-control">
              import project
              <input type="file" accept="application/json,.json,.notemaker" onChange={(event) => void handleProjectImport(event.target.files?.[0])} />
            </label>
            <button type="button" onClick={onExportProject}>
              export project
            </button>
            <label className="tempo-control">
              bpm
              <input type="number" min={60} max={240} value={project.tempo} onChange={(event) => onTempoChange(Number(event.target.value))} />
            </label>
          </div>
        </section>
        {guideOpen ? <ToolGuide onClose={() => setGuideOpen(false)} /> : null}
      </section>
    </main>
  );
}

function ActionAnimationBar({
  actionText,
  activeStepIndex,
  activeSlotId
}: {
  actionText: string;
  activeStepIndex: number;
  activeSlotId: number;
}) {
  return (
    <div className="lcd-action-bar" aria-label="LCD action animation">
      <div className="action-pixels" key={actionText} aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <span
            key={index}
            className={index === activeStepIndex ? "is-active" : ""}
            style={{ "--pixel-height": `${8 + ((index + activeSlotId) % 5) * 3}px` } as React.CSSProperties}
          />
        ))}
      </div>
      <strong>{actionText}</strong>
    </div>
  );
}

function getActionText({
  activePattern,
  activeSlotId,
  currentStep,
  playing,
  selectedKeyIndex,
  writeMode
}: {
  activePattern: Project["patterns"][number];
  activeSlotId: number;
  currentStep: number;
  playing: boolean;
  selectedKeyIndex: number;
  writeMode: boolean;
}): string {
  const writtenStep = activePattern.steps.find((step) =>
    step.triggers.some((trigger) => trigger.slotId === activeSlotId && trigger.keyIndex === selectedKeyIndex)
  );
  if (playing) return `play slot ${format2(activeSlotId)} step ${format2(currentStep + 1)}`;
  if (writeMode && writtenStep) {
    return `write slot ${format2(activeSlotId)} key ${format2(selectedKeyIndex)} step ${format2(writtenStep.index + 1)}`;
  }
  if (writeMode) return `write slot ${format2(activeSlotId)} key ${format2(selectedKeyIndex)}`;
  return `slot ${format2(activeSlotId)} key ${format2(selectedKeyIndex)} ready`;
}

function ToolGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="guide-backdrop">
      <section className="guide-dialog" role="dialog" aria-modal="true" aria-labelledby="tool-guide-title">
        <div className="guide-header">
          <div>
            <p className="device-eyebrow">quick guide</p>
            <h2 id="tool-guide-title">How NoteMaker Works</h2>
          </div>
          <button type="button" className="help-key" aria-label="Close tool guide" onClick={onClose}>
            x
          </button>
        </div>
        <div className="guide-grid">
          <GuideItem title="1. Pick a sound" body="Use the 16 slot pads. Slots 01-08 are melodic sounds, and 09-16 are drum sounds." />
          <GuideItem title="2. Pick a key" body="The long row of 16 keys chooses the pitch or slice that will be written into the pattern." />
          <GuideItem title="3. Write steps" body="Turn write on, then click steps to place or remove the selected slot in the active pattern." />
          <GuideItem title="4. Shape the sound" body="Trim, tone, and filter change what knobs A and B do for the selected slot." />
          <GuideItem title="5. Switch patterns" body="The pattern bank stores separate 16-step ideas. Choose another pattern to build a different loop." />
          <GuideItem title="6. Save and import" body="Import sound loads audio into the selected slot. Export project saves the current machine state as JSON." />
        </div>
      </section>
    </div>
  );
}

function GuideItem({ title, body }: { title: string; body: string }) {
  return (
    <article>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function PixelSampler({ playing, stepIndex }: { playing: boolean; stepIndex: number }) {
  return (
    <div
      className={`pixel-sampler ${playing ? "is-playing" : ""}`}
      aria-label="8-bit sample animation"
      role="img"
      style={{ "--pixel-step": stepIndex } as React.CSSProperties}
    >
      <span className="pixel-row pixel-row-top" />
      <span className="pixel-row pixel-row-mid" />
      <span className="pixel-row pixel-row-low" />
      <span className="pixel-eye pixel-eye-left" />
      <span className="pixel-eye pixel-eye-right" />
      <span className="pixel-meter" />
    </div>
  );
}

function LcdCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label} {value}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Knob({ slot, knob, mode, onChange }: { slot: SoundSlot; knob: "a" | "b"; mode: ParamMode; onChange: (knob: "a" | "b", value: number) => void }) {
  const config =
    mode === "trim"
      ? knob === "a"
        ? { label: "A start", min: 0, max: 1, step: 0.01, value: slot.trimStart }
        : { label: "B length", min: 0, max: 1, step: 0.01, value: slot.trimEnd }
      : mode === "tone"
        ? knob === "a"
          ? { label: "A pitch", min: -24, max: 24, step: 1, value: slot.pitch }
          : { label: "B gain", min: 0, max: 1.5, step: 0.01, value: slot.gain }
        : knob === "a"
          ? { label: "A filter", min: 0, max: 1, step: 0.01, value: slot.filter }
          : { label: "B res", min: 0, max: 1, step: 0.01, value: slot.resonance };

  return (
    <label className="knob-control">
      <span>{config.label}</span>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={config.value}
        onChange={(event) => onChange(knob, Number(event.target.value))}
      />
    </label>
  );
}

function format2(value: number): string {
  return String(value).padStart(2, "0");
}
