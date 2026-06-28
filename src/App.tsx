import { useEffect, useMemo, useRef, useState } from "react";
import { NoteMakerAudioEngine } from "./audio/engine";
import { Po33Device } from "./components/Po33Device";
import { ProductionPage } from "./components/ProductionPage";
import { downloadProject } from "./domain/project";
import { createSchedulePlan } from "./domain/sequencer";
import { useProjectStore } from "./store/useProjectStore";

type AppView = "notemaker" | "production";

export default function App() {
  const {
    project,
    selectedKeyIndex,
    importError,
    selectSlot,
    selectPattern,
    setSelectedKey,
    toggleWriteMode,
    toggleStep,
    removeTrigger,
    adjustTimingOffset,
    setTempo,
    setSlotParam,
    importProject,
    setImportError,
    resetProject,
    addArrangementClip,
    moveArrangementClip,
    resizeArrangementClip,
    toggleArrangementClipMute,
    toggleArrangementLaneMute
  } = useProjectStore();
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [appView, setAppView] = useState<AppView>(() => hashToView());
  const engineRef = useRef(new NoteMakerAudioEngine());
  const schedulePlan = useMemo(() => createSchedulePlan(project), [project]);

  useEffect(() => {
    return () => engineRef.current.dispose();
  }, []);

  useEffect(() => {
    function handleHashChange() {
      setAppView(hashToView());
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const stepDurationMs = Math.max(35, 60000 / project.tempo / 4);
    const intervalId = window.setInterval(() => {
      setCurrentStep((step) => (step + 1) % 16);
    }, stepDurationMs);
    return () => window.clearInterval(intervalId);
  }, [playing, project.tempo]);

  useEffect(() => {
    if (currentStep > 15) setCurrentStep(0);
  }, [currentStep]);

  async function handlePlay() {
    try {
      if (appView === "production") {
        await engineRef.current.scheduleArrangement(project);
      } else {
        await engineRef.current.scheduleProject(project);
      }
      setCurrentStep(0);
      await engineRef.current.play();
      setPlaying(true);
      setImportError(null);
    } catch (error) {
      setPlaying(false);
      setImportError(audioErrorMessage(error));
    }
  }

  function handleSelectSlot(slotId: number) {
    selectSlot(slotId);
    triggerPreview(slotId, selectedKeyIndex);
  }

  function handleSelectKey(keyIndex: number) {
    setSelectedKey(keyIndex);
    triggerPreview(project.activeSlotId, keyIndex);
  }

  function triggerPreview(slotId: number, keyIndex: number) {
    if (!canUseBrowserAudio()) return;
    void engineRef.current.triggerPreview(project, slotId, keyIndex).catch((error) => setImportError(audioErrorMessage(error)));
  }

  function handleStop() {
    engineRef.current.stop();
    setPlaying(false);
    setCurrentStep(0);
  }

  function handleViewChange(nextView: AppView) {
    handleStop();
    setAppView(nextView);
    if (window.location.hash !== `#${nextView}`) window.location.hash = nextView;
  }

  if (appView === "production") {
    return (
      <ProductionPage
        project={project}
        playing={playing}
        onBack={() => handleViewChange("notemaker")}
        onPlay={() => void handlePlay()}
        onStop={handleStop}
        onAddClip={addArrangementClip}
        onMoveClip={moveArrangementClip}
        onResizeClip={resizeArrangementClip}
        onToggleClipMute={toggleArrangementClipMute}
        onToggleLaneMute={toggleArrangementLaneMute}
      />
    );
  }

  return (
    <Po33Device
      project={project}
      selectedKeyIndex={selectedKeyIndex}
      currentStep={currentStep}
      playing={playing}
      importError={importError}
      onSelectSlot={handleSelectSlot}
      onSelectPattern={selectPattern}
      onSelectKey={handleSelectKey}
      onToggleWrite={toggleWriteMode}
      onToggleStep={toggleStep}
      onRemoveTrigger={removeTrigger}
      onAdjustTimingOffset={adjustTimingOffset}
      onTempoChange={setTempo}
      onSlotParamChange={setSlotParam}
      onImportProject={importProject}
      onImportError={setImportError}
      onExportProject={() => downloadProject({ ...project, chain: { patternIds: schedulePlan.length ? project.chain.patternIds : [project.activePatternId] } })}
      onResetProject={resetProject}
      onOpenProduction={() => handleViewChange("production")}
      onPlay={() => void handlePlay()}
      onStop={handleStop}
    />
  );
}

function audioErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Could not load this sound.";
}

function canUseBrowserAudio(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
}

function hashToView(): AppView {
  if (typeof window === "undefined") return "notemaker";
  return window.location.hash === "#production" ? "production" : "notemaker";
}
