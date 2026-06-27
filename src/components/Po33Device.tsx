import { useState } from "react";
import { DRUM_KEY_VARIATIONS, PERFORMANCE_KEY_MIDI } from "../audio/music";
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
  onRemoveTrigger: (stepIndex: number, slotId: number, keyIndex: number) => void;
  onAdjustTimingOffset: (stepIndex: number, deltaTicks: number) => void;
  onTempoChange: (tempo: number) => void;
  onParamModeChange: (mode: ParamMode) => void;
  onKnobChange: (knob: "a" | "b", value: number) => void;
  onImportProject: (project: Project) => void;
  onImportError: (message: string) => void;
  onExportProject: () => void;
  onResetProject: () => void;
  onPlay: () => void;
  onStop: () => void;
};

const PARAM_MODES: ParamMode[] = ["trim", "tone", "filter"];
const TEMPO_CATEGORIES = [
  { label: "Slow", tempo: 72, description: "spacious" },
  { label: "Hip hop", tempo: 90, description: "head-nod" },
  { label: "Disco", tempo: 120, description: "steady" },
  { label: "Techno", tempo: 140, description: "driving" },
  { label: "Fast", tempo: 170, description: "rapid" }
] as const;

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
  onRemoveTrigger,
  onAdjustTimingOffset,
  onTempoChange,
  onParamModeChange,
  onKnobChange,
  onImportProject,
  onImportError,
  onExportProject,
  onResetProject,
  onPlay,
  onStop
}: Po33DeviceProps) {
  const activeSlot = project.slots.find((slot) => slot.id === project.activeSlotId) ?? project.slots[0];
  const activePattern = project.patterns.find((pattern) => pattern.id === project.activePatternId) ?? project.patterns[0];
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
  const [slotPage, setSlotPage] = useState(0);
  const slotPageCount = Math.max(Math.ceil(project.slots.length / 16), 1);
  const safeSlotPage = Math.min(slotPage, slotPageCount - 1);
  const slotPageStart = safeSlotPage * 16;
  const visibleSlots = project.slots.slice(slotPageStart, slotPageStart + 16);
  const slotPageLabel = `${format2(slotPageStart + 1)}-${format2(slotPageStart + visibleSlots.length)}`;

  async function handleProjectImport(file: File | undefined) {
    if (!file) return;
    try {
      onImportProject(parseProject(await file.text()));
    } catch {
      onImportError("Could not import this project. Check that the file is valid NoteMaker JSON.");
    }
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
            <button type="button" className="help-key icon-control" aria-label="Open tool guide" title="Tool guide" onClick={() => setGuideOpen(true)}>
              <Icon glyph="info" />
            </button>
            <label className="file-control icon-control" title="Import project">
              <Icon glyph="import" />
              <span className="sr-only">import project</span>
              <input type="file" accept="application/json,.json,.notemaker" onChange={(event) => void handleProjectImport(event.target.files?.[0])} />
            </label>
            <button type="button" className="icon-control" aria-label="Export project" title="Export project" onClick={onExportProject}>
              <Icon glyph="export" />
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
          {importError ? <p className="error-text header-error">{importError}</p> : null}
        </header>

        <section className="flow-panel" aria-label="Beat flow overview">
          <div className="flow-header">
            <ControlLabel
              index="1"
              title="Beat flow"
              body="tap chip x to remove"
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
            onAdjustTimingOffset={onAdjustTimingOffset}
            onRemoveTrigger={onRemoveTrigger}
          />
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

          <section className="slot-bank" aria-label={`Sound slots page ${slotPageLabel}`}>
            <div className="slot-bank-header">
              <ControlLabel
                index="3"
                title="Sound slots"
                body={`pick source · ${slotPageLabel}`}
              />
              <div className="slot-page-controls" aria-label="Sound slot pages">
                <button
                  type="button"
                  aria-label="Previous sound slot page"
                  disabled={safeSlotPage === 0}
                  onClick={() => setSlotPage((page) => Math.max(page - 1, 0))}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next sound slot page"
                  disabled={safeSlotPage >= slotPageCount - 1}
                  onClick={() => setSlotPage((page) => Math.min(page + 1, slotPageCount - 1))}
                >
                  ›
                </button>
              </div>
            </div>
            {visibleSlots.map((slot) => (
              <button
                type="button"
                key={slot.id}
                className={`slot-pad slot-pad-${slot.type} ${slot.id === project.activeSlotId ? "is-selected" : ""} ${slot.isPlaceholder ? "is-placeholder" : ""}`}
                aria-label={slot.isPlaceholder ? "Add sound import planned" : `Slot ${format2(slot.id)} ${slot.name} ${slot.type}`}
                aria-pressed={slot.id === project.activeSlotId}
                disabled={slot.isPlaceholder}
                onClick={() => onSelectSlot(slot.id)}
              >
                <span>{slot.isPlaceholder ? "+" : format2(slot.id)}</span>
                <strong>{slot.name}</strong>
                <small>{slot.isPlaceholder ? "Import planned" : slot.type}</small>
              </button>
            ))}
          </section>
        </div>

        <section className="key-bank" aria-label="16 performance keys">
          <ControlLabel
            index="4"
            title="Performance keys"
            body={activeSlot.type === "drum" ? "choose a drum variation that gets auditioned or written" : "choose the pitch that gets auditioned or written"}
          />
          {Array.from({ length: 16 }, (_, index) => {
            const keyIndex = index + 1;
            const keyLabel = activeSlot.type === "drum" ? DRUM_KEY_VARIATIONS[index].label : noteNameForMidi(PERFORMANCE_KEY_MIDI[index]);
            return (
              <button
                type="button"
                key={index}
                aria-label={`Key ${format2(keyIndex)} ${keyLabel}`}
                aria-pressed={selectedKeyIndex === keyIndex}
                onClick={() => onSelectKey(keyIndex)}
              >
                <strong>{keyIndex}</strong>
                <small>{keyLabel}</small>
              </button>
            );
          })}
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

          <TempoControl tempo={project.tempo} onTempoChange={onTempoChange} />
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

function ControlLabel({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="control-label">
      <span>{index}</span>
      <strong>{title}</strong>
      <small>{body}</small>
    </div>
  );
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
  onRemoveTrigger,
  onAdjustTimingOffset,
  pattern,
  playing,
  slots
}: {
  currentStep: number;
  onRemoveTrigger: (stepIndex: number, slotId: number, keyIndex: number) => void;
  onAdjustTimingOffset: (stepIndex: number, deltaTicks: number) => void;
  pattern: Project["patterns"][number];
  playing: boolean;
  slots: SoundSlot[];
}) {
  return (
    <div className="beat-flow-strip" aria-label="Beat flow timeline">
      {pattern.steps.map((step) => {
        const isCurrent = step.index === currentStep;
        const timingOffsetTicks = step.timingOffsetTicks ?? 0;
        const timingDirection = timingOffsetTicks < 0 ? `early ${Math.abs(timingOffsetTicks)}` : timingOffsetTicks > 0 ? `late ${timingOffsetTicks}` : "centered";
        const triggerSlots = step.triggers.map((trigger) => ({
          trigger,
          slot: slots.find((slot) => slot.id === trigger.slotId) ?? null
        }));
        return (
          <div
            key={step.index}
            className={`flow-step ${isCurrent ? "is-current" : ""} ${triggerSlots.length ? "has-events" : ""}`}
            aria-label={`Flow step ${format2(step.index + 1)} ${step.triggers.length ? `${step.triggers.length} sounds` : "empty"} timing ${timingDirection}`}
          >
            <span className="flow-step-number">{format2(step.index + 1)}</span>
            <div className="flow-lane">
              {triggerSlots.map(({ slot, trigger }, order) =>
                slot ? (
                  <button
                    type="button"
                    key={`${slot.id}-${trigger.keyIndex}-${order}`}
                    className={`flow-trigger flow-trigger-${slot.type}`}
                    title={`${order + 1}. ${format2(slot.id)} ${slot.name}`}
                    aria-label={`Remove slot ${format2(slot.id)} ${slot.name} from beat ${format2(step.index + 1)}`}
                    onClick={() => onRemoveTrigger(step.index, slot.id, trigger.keyIndex)}
                  >
                    <span>{format2(slot.id)}</span>
                    <span className="flow-remove-mark" aria-hidden="true">x</span>
                  </button>
                ) : null
              )}
            </div>
            <span className={`flow-playhead ${playing && isCurrent ? "is-running" : ""}`} aria-hidden="true" />
            <div className="flow-timing-control" aria-label={`Timing offset for beat ${format2(step.index + 1)}`}>
              <button
                type="button"
                aria-label={`Move beat ${format2(step.index + 1)} earlier`}
                disabled={timingOffsetTicks <= -3}
                onClick={() => onAdjustTimingOffset(step.index, -1)}
              >
                -
              </button>
              <span aria-hidden="true">{formatSigned(timingOffsetTicks)}</span>
              <button
                type="button"
                aria-label={`Move beat ${format2(step.index + 1)} later`}
                disabled={timingOffsetTicks >= 3}
                onClick={() => onAdjustTimingOffset(step.index, 1)}
              >
                +
              </button>
            </div>
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
          <GuideItem title="1. Pick a sound" body="Use the Sound Slots arrows to page through 16 visible sources at a time. The first page keeps the original NoteMaker sounds." />
          <GuideItem title="2. Pick a key" body="The long row of 16 keys chooses the pitch or slice that will be written into the pattern." />
          <GuideItem title="3. Write steps" body="Turn write on, then click steps to place or remove the selected slot in the active pattern. Play is silent until events is above 0." />
          <GuideItem title="4. Shape the sound" body="Trim, tone, and filter change what knobs A and B do for the selected slot." />
          <GuideItem title="5. Switch patterns" body="The pattern bank stores separate 16-step ideas. Choose another pattern to build a different loop." />
          <GuideItem title="6. Save and export" body="Sound import is paused for now. Export project saves the current machine state as JSON." />
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
      "Slot pads are the sound bank. Use the arrows to browse pages of 16 sources, then click one pad to choose the sound you are editing or writing.",
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
      "Play starts the pattern from step 01 and advances the Beat Flow. If events is 0, there are no written notes yet, so write a step before expecting loop sound.",
    showLabel: "Toggle transport"
  },
  {
    id: "files",
    title: "8. Save and export",
    target: "project import / export",
    body:
      "Sound import is paused for now. Import project restores a saved JSON machine state. Export project downloads the current slots, patterns, tempo, and chain.",
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

function Icon({ glyph }: { glyph: "info" | "sound" | "import" | "export" }) {
  return (
    <svg className="control-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {glyph === "info" ? (
        <>
          <path d="M12 10v7" />
          <path d="M12 7h.01" />
        </>
      ) : null}
      {glyph === "sound" ? (
        <>
          <path d="M4 14h3l5 4V6l-5 4H4z" />
          <path d="M16 9c1.3 1.7 1.3 4.3 0 6" />
          <path d="M19 7c2.2 3 2.2 7 0 10" />
        </>
      ) : null}
      {glyph === "import" ? (
        <>
          <path d="M12 4v10" />
          <path d="M8 10l4 4 4-4" />
          <path d="M5 18h14" />
        </>
      ) : null}
      {glyph === "export" ? (
        <>
          <path d="M12 20V10" />
          <path d="M8 14l4-4 4 4" />
          <path d="M5 6h14" />
        </>
      ) : null}
    </svg>
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
  const category = getTempoCategory(tempo);

  return (
    <div className="tempo-module" aria-label="Tempo control">
      <div className="tempo-topline">
        <span>bpm</span>
        <strong>{tempo}</strong>
      </div>
      <div className="tempo-category-grid" aria-label="BPM category presets">
        {TEMPO_CATEGORIES.map((candidate) => (
          <button
            type="button"
            key={candidate.label}
            aria-label={`${candidate.label} tempo ${candidate.tempo} BPM`}
            aria-pressed={candidate.label === category.label}
            onClick={() => onTempoChange(candidate.tempo)}
          >
            <strong>{candidate.label}</strong>
            <span>{candidate.tempo}</span>
          </button>
        ))}
      </div>
      <div className="tempo-nudge">
        <button type="button" aria-label="Decrease BPM" onClick={() => onTempoChange(Math.max(60, tempo - 1))}>
          -
        </button>
        <p className="tempo-classification">
          <strong>{category.label}</strong>
          {category.description}
        </p>
        <button type="button" aria-label="Increase BPM" onClick={() => onTempoChange(Math.min(240, tempo + 1))}>
          +
        </button>
      </div>
    </div>
  );
}

function getTempoCategory(tempo: number): { label: string; description: string } {
  if (tempo < 82) return { label: "Slow", description: " spacious timing" };
  if (tempo < 105) return { label: "Hip hop", description: " head-nod pocket" };
  if (tempo < 132) return { label: "Disco", description: " steady groove" };
  if (tempo < 156) return { label: "Techno", description: " driving loop" };
  return { label: "Fast", description: " rapid sequence" };
}

function noteNameForMidi(midi: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  return `${names[midi % 12]}${octave}`;
}

function format2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
