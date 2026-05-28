import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { NoteMakerAudioEngine, createSchedulePlan } from "./audio/engine";
import { InstrumentPalette } from "./components/InstrumentPalette";
import { PocketDeck } from "./components/PocketDeck";
import { ProjectToolbar } from "./components/ProjectToolbar";
import { TimelineGrid } from "./components/TimelineGrid";
import { TransportBar } from "./components/TransportBar";
import { downloadProject } from "./domain/project";
import type { InstrumentId, Project } from "./domain/types";
import { useProjectStore } from "./store/useProjectStore";

export default function App() {
  const {
    project,
    selectedInstrumentId,
    setSelectedInstrument,
    setTempo,
    setLoopEnabled,
    setLoopRange,
    addClip,
    moveClip,
    resizeClip,
    duplicateClip,
    removeClip,
    toggleRepeat,
    toggleMute,
    toggleSolo,
    importProject,
    resetProject
  } = useProjectStore();
  const [playing, setPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const engineRef = useRef(new NoteMakerAudioEngine());
  const schedulePlan = useMemo(() => createSchedulePlan(project), [project]);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  useEffect(() => {
    return () => engineRef.current.dispose();
  }, []);

  useEffect(() => {
    if (!playing) return;
    const stepDurationMs = Math.max(80, 60000 / project.tempo);
    const startStep = project.loop.enabled ? project.loop.startStep : 0;
    const endStep = project.loop.enabled ? project.loop.endStep : project.steps;
    const intervalId = window.setInterval(() => {
      setCurrentStep((step) => {
        const nextStep = step + 1;
        return nextStep >= endStep ? startStep : nextStep;
      });
    }, stepDurationMs);
    return () => window.clearInterval(intervalId);
  }, [playing, project.loop.enabled, project.loop.endStep, project.loop.startStep, project.steps, project.tempo]);

  function handleDragEnd(event: DragEndEvent) {
    const over = event.over?.data.current;
    const active = event.active.data.current;
    if (!over || over.type !== "cell") return;

    if (active?.type === "clip") {
      moveClip(active.clipId as string, over.trackId as string, over.step as number);
      return;
    }

    if (active?.type === "palette") {
      addClip(over.trackId as string, active.instrumentId as InstrumentId, over.step as number);
      return;
    }

    addClip(over.trackId as string, selectedInstrumentId, over.step as number);
  }

  async function handlePlay() {
    await engineRef.current.init();
    setAudioReady(true);
    engineRef.current.scheduleProject(project);
    setCurrentStep(project.loop.enabled ? project.loop.startStep : 0);
    await engineRef.current.play();
    setPlaying(true);
  }

  function handlePause() {
    engineRef.current.pause();
    setPlaying(false);
  }

  function handleStop() {
    engineRef.current.stop();
    setPlaying(false);
    setCurrentStep(project.loop.enabled ? project.loop.startStep : 0);
  }

  function handleImport(importedProject: Project) {
    importProject(importedProject);
    engineRef.current.stop();
    setPlaying(false);
    setCurrentStep(importedProject.loop.enabled ? importedProject.loop.startStep : 0);
  }

  function handleSelectPattern(patternIndex: number) {
    const startStep = patternIndex * 16;
    const endStep = Math.min(startStep + 16, project.steps);
    setLoopEnabled(true);
    setLoopRange(startStep, endStep);
    setCurrentStep(startStep);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <main className="app-shell">
        <ProjectToolbar
          project={project}
          scheduleCount={schedulePlan.length}
          onExport={() => downloadProject(project)}
          onImport={handleImport}
          onReset={resetProject}
        />
        <div className="workspace">
          <InstrumentPalette selectedInstrumentId={selectedInstrumentId} onSelect={setSelectedInstrument} />
          <div className="composer-stack">
            <PocketDeck
              project={project}
              currentStep={currentStep}
              playing={playing}
              schedulePlan={schedulePlan}
              selectedInstrumentId={selectedInstrumentId}
              onSelectInstrument={setSelectedInstrument}
              onSelectPattern={handleSelectPattern}
            />
            <TimelineGrid
              project={project}
              activeStep={currentStep}
              onResizeClip={resizeClip}
              onDuplicateClip={duplicateClip}
              onRemoveClip={removeClip}
              onToggleRepeat={toggleRepeat}
              onToggleMute={toggleMute}
              onToggleSolo={toggleSolo}
            />
          </div>
          <aside className="inspector" aria-label="Song inspector">
            <div className="panel-heading">
              <p className="eyebrow">Map legend</p>
              <h2>Song shape</h2>
            </div>
            <dl>
              <div>
                <dt>Audio</dt>
                <dd>{audioReady ? "Ready" : "Tap Play to start"}</dd>
              </div>
              <div>
                <dt>Loop</dt>
                <dd>
                  {project.loop.startStep + 1}-{project.loop.endStep}
                </dd>
              </div>
              <div>
                <dt>Selected</dt>
                <dd>{selectedInstrumentId}</dd>
              </div>
            </dl>
          </aside>
        </div>
        <TransportBar
          project={project}
          playing={playing}
          onPlay={() => void handlePlay()}
          onPause={handlePause}
          onStop={handleStop}
          onTempoChange={setTempo}
          onLoopToggle={setLoopEnabled}
          onLoopRangeChange={setLoopRange}
        />
      </main>
    </DndContext>
  );
}
