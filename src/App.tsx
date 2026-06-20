import { useEffect, useMemo, useRef, useState } from "react";
import { NoteMakerAudioEngine } from "./audio/engine";
import { Po33Device } from "./components/Po33Device";
import { downloadProject } from "./domain/project";
import { createSchedulePlan } from "./domain/sequencer";
import { useProjectStore } from "./store/useProjectStore";

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
    setTempo,
    setParamMode,
    setKnobValue,
    importSampleFile,
    importProject,
    resetProject
  } = useProjectStore();
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const engineRef = useRef(new NoteMakerAudioEngine());
  const schedulePlan = useMemo(() => createSchedulePlan(project), [project]);

  useEffect(() => {
    return () => engineRef.current.dispose();
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
    await engineRef.current.init();
    engineRef.current.scheduleProject(project);
    setCurrentStep(0);
    await engineRef.current.play();
    setPlaying(true);
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
    void engineRef.current.triggerPreview(project, slotId, keyIndex);
  }

  function handleStop() {
    engineRef.current.stop();
    setPlaying(false);
    setCurrentStep(0);
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
      onTempoChange={setTempo}
      onParamModeChange={setParamMode}
      onKnobChange={setKnobValue}
      onImportSample={importSampleFile}
      onImportProject={importProject}
      onExportProject={() => downloadProject({ ...project, chain: { patternIds: schedulePlan.length ? project.chain.patternIds : [project.activePatternId] } })}
      onResetProject={resetProject}
      onPlay={() => void handlePlay()}
      onStop={handleStop}
    />
  );
}

function canUseBrowserAudio(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
}
