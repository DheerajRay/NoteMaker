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
    const stepDurationMs = Math.max(70, 60000 / project.tempo);
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
      onSelectSlot={selectSlot}
      onSelectPattern={selectPattern}
      onSelectKey={setSelectedKey}
      onToggleWrite={toggleWriteMode}
      onToggleStep={toggleStep}
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
