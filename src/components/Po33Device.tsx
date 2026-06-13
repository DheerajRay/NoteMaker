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
  const actionHint = getActionHint({
    activeSlot,
    scheduledCount,
    selectedKeyIndex,
    writeMode: project.writeMode
  });
  const [guideOpen, setGuideOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(0);

  async function handleProjectImport(file: File | undefined) {
    if (!file) return;
    onImportProject(parseProject(await file.text()));
  }

  function handleDemoAction(stepId: DemoStepId) {
    if (stepId === "slots") {
      onSelectSlot(9);
      if (project.writeMode) onToggleWrite();
      return;
    }

    if (stepId === "keys") {
      onSelectKey(5);
      return;
    }

    if (stepId === "write") {
      if (!project.writeMode) onToggleWrite();
      return;
    }

    if (stepId === "steps") {
      const demoStep = activePattern.steps[4];
      const alreadyWritten = demoStep?.triggers.some(
        (trigger) => trigger.slotId === 9 && trigger.keyIndex === selectedKeyIndex
      );
      onSelectSlot(9);
      if (!project.writeMode) onToggleWrite();
      if (!alreadyWritten) onToggleStep(4);
      return;
    }

    if (stepId === "patterns") {
      onSelectPattern(project.activePatternId === 1 ? 2 : 1);
      return;
    }

    if (stepId === "knobs") {
      onParamModeChange("tone");
      onKnobChange("a", Math.min(activeSlot.pitch + 1, 24));
      return;
    }

    if (stepId === "transport") {
      if (playing) onStop();
      else onPlay();
    }
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
            <button type="button" className="demo-key" aria-label="Start guided demo" onClick={() => setDemoOpen(true)}>
              demo
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

        <section className="flow-panel" aria-label="Beat flow overview">
          <div className="flow-header">
            <ControlLabel
              index="1"
              title="Beat flow"
              body="loop overview"
            />
            <div className="current-action" aria-label="Current action">
              <span className="status-dot" aria-hidden="true" />
              <strong>{actionHint.title}</strong>
              <span>{actionHint.body}</span>
            </div>
          </div>
          <BeatFlowStrip
            currentStep={currentStep}
            pattern={activePattern}
            playing={playing}
            slots={project.slots}
          />
          {scheduledCount === 0 ? (
            <p className="empty-pattern-hint">
              No notes written yet. Turn write on, choose a sound, then click a step to place the first beat.
            </p>
          ) : null}
        </section>

        <div className="machine-grid">
          <section className="sequencer-bank" aria-label="Step sequencer">
            <ControlLabel
              index="2"
              title="Step buttons"
              body="write mode on: click 1-16 to place or remove the selected sound"
            />
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
            <ControlLabel
              index="3"
              title="Sound slots"
              body="choose the sound source: 01-08 melodic, 09-16 drums"
            />
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
          <ControlLabel
            index="4"
            title="Performance keys"
            body="choose the pitch or slice that gets auditioned or written"
          />
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
            <ControlLabel
              index="5"
              title="Patterns"
              body="switch between 16 separate loops"
            />
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
            <TempoControl tempo={project.tempo} onTempoChange={onTempoChange} />
          </div>
        </section>
        {guideOpen ? <ToolGuide onClose={() => setGuideOpen(false)} /> : null}
        {demoOpen ? (
          <GuidedButtonDemo
            stepIndex={demoStepIndex}
            onStepIndexChange={setDemoStepIndex}
            onShowButton={handleDemoAction}
            onClose={() => setDemoOpen(false)}
          />
        ) : null}
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

function ControlLabel({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="control-label">
      <span>{index}</span>
      <strong>{title}</strong>
      <small>{body}</small>
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

function getActionHint({
  activeSlot,
  scheduledCount,
  selectedKeyIndex,
  writeMode
}: {
  activeSlot: SoundSlot;
  scheduledCount: number;
  selectedKeyIndex: number;
  writeMode: boolean;
}): { title: string; body: string } {
  const selected = `Slot ${format2(activeSlot.id)} ${activeSlot.name} + Key ${format2(selectedKeyIndex)}`;
  if (writeMode) {
    return {
      title: selected,
      body: "Write on: click a step to place/remove."
    };
  }
  if (scheduledCount === 0) {
    return {
      title: selected,
      body: "Audition keys. Write steps before play."
    };
  }
  return {
    title: selected,
    body: "Write off: keys audition, steps stay unchanged."
  };
}

function BeatFlowStrip({
  currentStep,
  pattern,
  playing,
  slots
}: {
  currentStep: number;
  pattern: Project["patterns"][number];
  playing: boolean;
  slots: SoundSlot[];
}) {
  return (
    <div className="beat-flow-strip" aria-label="Beat flow timeline">
      {pattern.steps.map((step) => {
        const isCurrent = step.index === currentStep;
        const triggerSlots = step.triggers
          .map((trigger) => slots.find((slot) => slot.id === trigger.slotId))
          .filter((slot): slot is SoundSlot => Boolean(slot));
        return (
          <div
            key={step.index}
            className={`flow-step ${isCurrent ? "is-current" : ""} ${triggerSlots.length ? "has-events" : ""}`}
            aria-label={`Flow step ${format2(step.index + 1)} ${triggerSlots.length ? `${triggerSlots.length} sounds` : "empty"}`}
          >
            <span className="flow-step-number">{format2(step.index + 1)}</span>
            <div className="flow-lane">
              {triggerSlots.slice(0, 3).map((slot) => (
                <span
                  key={slot.id}
                  className={`flow-trigger flow-trigger-${slot.type}`}
                  title={`${format2(slot.id)} ${slot.name}`}
                  aria-hidden="true"
                >
                  {format2(slot.id)}
                </span>
              ))}
              {triggerSlots.length > 3 ? <span className="flow-more" aria-hidden="true">+{triggerSlots.length - 3}</span> : null}
            </div>
            <span className={`flow-playhead ${playing && isCurrent ? "is-running" : ""}`} aria-hidden="true" />
          </div>
        );
      })}
    </div>
  );
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
          <GuideItem title="3. Write steps" body="Turn write on, then click steps to place or remove the selected slot in the active pattern. Play is silent until events is above 0." />
          <GuideItem title="4. Shape the sound" body="Trim, tone, and filter change what knobs A and B do for the selected slot." />
          <GuideItem title="5. Switch patterns" body="The pattern bank stores separate 16-step ideas. Choose another pattern to build a different loop." />
          <GuideItem title="6. Save and import" body="Import sound loads audio into the selected slot. Export project saves the current machine state as JSON." />
        </div>
      </section>
    </div>
  );
}

type DemoStepId = "slots" | "keys" | "write" | "steps" | "patterns" | "knobs" | "transport" | "files";

type DemoStep = {
  id: DemoStepId;
  title: string;
  target: string;
  body: string;
  showLabel: string;
};

const DEMO_STEPS: DemoStep[] = [
  {
    id: "slots",
    title: "1. Slot pads",
    target: "16 sound slots",
    body:
      "Slot pads are the sound bank. Click one pad to choose the sound you are editing or writing. Slots 01-08 act like melodic sample slots, and slots 09-16 act like drum/percussion slots.",
    showLabel: "Select slot 09"
  },
  {
    id: "keys",
    title: "2. Key row",
    target: "16 performance keys",
    body:
      "Key row chooses the pitch or slice for the selected sound. Think of it as the note/slice value that will be stored when write mode is on.",
    showLabel: "Select key 05"
  },
  {
    id: "write",
    title: "3. Write button",
    target: "write",
    body:
      "Write decides whether step buttons edit the pattern. Off means step clicks are ignored. On means each step click places or removes the selected slot and key.",
    showLabel: "Turn write on"
  },
  {
    id: "steps",
    title: "4. Step keys",
    target: "1-16 step sequencer",
    body:
      "Step keys are the timeline. With write on, click a step to place the selected sound there. A bright step contains a trigger, and the darker orange step is the current playback position.",
    showLabel: "Write step 05"
  },
  {
    id: "patterns",
    title: "5. Pattern bank",
    target: "pattern buttons",
    body:
      "Pattern buttons switch between separate 16-step loops. Use them when you want another beat idea without replacing the current one.",
    showLabel: "Switch pattern"
  },
  {
    id: "knobs",
    title: "6. Mode and knobs",
    target: "trim, tone, filter, A, B",
    body:
      "Trim, tone, and filter choose what knobs A and B control. The knobs always edit the selected slot, so pick the slot first, then shape it.",
    showLabel: "Move tone A"
  },
  {
    id: "transport",
    title: "7. Play and stop",
    target: "play / stop",
    body:
      "Play starts the pattern from step 01 and animates the LCD. If events is 0, there are no written notes yet, so write a step before expecting loop sound.",
    showLabel: "Toggle transport"
  },
  {
    id: "files",
    title: "8. Import and export",
    target: "import sound / project",
    body:
      "Import sound loads an audio file into the selected slot. Import project restores a saved JSON machine state. Export project downloads the current slots, patterns, tempo, and chain.",
    showLabel: "Review file buttons"
  }
];

function GuidedButtonDemo({
  stepIndex,
  onStepIndexChange,
  onShowButton,
  onClose
}: {
  stepIndex: number;
  onStepIndexChange: (stepIndex: number) => void;
  onShowButton: (stepId: DemoStepId) => void;
  onClose: () => void;
}) {
  const step = DEMO_STEPS[stepIndex] ?? DEMO_STEPS[0];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === DEMO_STEPS.length - 1;

  return (
    <div className="guide-backdrop">
      <section className="guide-dialog demo-dialog" role="dialog" aria-modal="true" aria-labelledby="guided-demo-title">
        <div className="guide-header">
          <div>
            <p className="device-eyebrow">button by button</p>
            <h2 id="guided-demo-title">Guided Button Demo</h2>
          </div>
          <button type="button" className="help-key" aria-label="Close guided demo" onClick={onClose}>
            x
          </button>
        </div>

        <div className="demo-progress" aria-label="Demo progress">
          {DEMO_STEPS.map((candidate, index) => (
            <button
              type="button"
              key={candidate.id}
              aria-label={`Demo step ${index + 1}: ${candidate.title}`}
              aria-pressed={index === stepIndex}
              onClick={() => onStepIndexChange(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <article className="demo-panel">
          <p className="device-eyebrow">look at: {step.target}</p>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </article>

        <div className="demo-actions">
          <button type="button" className="transport-key" onClick={() => onShowButton(step.id)}>
            Show this button
          </button>
          <span>{step.showLabel}</span>
          <div>
            <button type="button" disabled={isFirst} aria-label="Previous demo step" onClick={() => onStepIndexChange(stepIndex - 1)}>
              prev
            </button>
            <button type="button" disabled={isLast} aria-label="Next demo step" onClick={() => onStepIndexChange(stepIndex + 1)}>
              next
            </button>
          </div>
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

function TempoControl({ tempo, onTempoChange }: { tempo: number; onTempoChange: (tempo: number) => void }) {
  const classification = getTempoClassification(tempo);
  const meterPosition = `${((tempo - 60) / 180) * 100}%`;

  return (
    <div className="tempo-module" aria-label="Tempo control">
      <div className="tempo-topline">
        <span>bpm</span>
        <strong>{tempo}</strong>
      </div>
      <label>
        <span className="sr-only">BPM</span>
        <input
          type="range"
          min={60}
          max={240}
          value={tempo}
          aria-label="BPM"
          onChange={(event) => onTempoChange(Number(event.target.value))}
        />
      </label>
      <div className="tempo-meter" aria-hidden="true">
        <span style={{ left: meterPosition }} />
      </div>
      <div className="tempo-scale" aria-hidden="true">
        <span>low</span>
        <span>mid</span>
        <span>high</span>
      </div>
      <p className="tempo-classification">
        <strong>{classification.label}</strong>
        {classification.description}
      </p>
    </div>
  );
}

function getTempoClassification(tempo: number): { label: string; description: string } {
  if (tempo < 80) return { label: "Slow", description: " heavy, spacious timing" };
  if (tempo < 110) return { label: "Laid back", description: " relaxed pocket for slower loops" };
  if (tempo < 130) return { label: "Groove", description: " balanced beat-making range" };
  if (tempo < 160) return { label: "Fast", description: " energetic, dance-leaning pace" };
  return { label: "Very fast", description: " tight, rapid sequencing" };
}

function format2(value: number): string {
  return String(value).padStart(2, "0");
}
