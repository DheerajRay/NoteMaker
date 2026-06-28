import { useState } from "react";
import type { ArrangementClip, ArrangementLane, ArrangementLaneId, Pattern, Project } from "../domain/types";

type ProductionPageProps = {
  project: Project;
  playing: boolean;
  onBack: () => void;
  onPlay: () => void;
  onStop: () => void;
  onAddClip: (patternId: number, laneId: ArrangementLaneId, startBar: number) => void;
  onMoveClip: (clipId: string, laneId: ArrangementLaneId, startBar: number) => void;
  onResizeClip: (clipId: string, deltaBars: number) => void;
  onToggleClipMute: (clipId: string) => void;
  onToggleLaneMute: (laneId: ArrangementLaneId) => void;
  onResetArrangement: () => void;
  onLoadDemoArrangement: () => void;
};

export function ProductionPage({
  project,
  playing,
  onBack,
  onPlay,
  onStop,
  onAddClip,
  onMoveClip,
  onResizeClip,
  onToggleClipMute,
  onToggleLaneMute,
  onResetArrangement,
  onLoadDemoArrangement
}: ProductionPageProps) {
  const [selectedPatternId, setSelectedPatternId] = useState(1);
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const selectedPattern = project.patterns.find((pattern) => pattern.id === selectedPatternId) ?? project.patterns[0];
  const barCount = project.arrangement.songLengthBars;

  function handleDrop(laneId: ArrangementLaneId, startBar: number, clipId?: string) {
    const safeClipId = clipId || draggedClipId;
    if (safeClipId) onMoveClip(safeClipId, laneId, startBar);
    setDraggedClipId(null);
  }

  return (
    <main className="po33-app production-app">
      <section className="production-shell" aria-label="Pattern production arranger">
        <header className="device-header production-header">
          <div>
            <p className="device-eyebrow">pattern production</p>
            <h1>Production</h1>
          </div>
          <div className="transport-cluster">
            <button type="button" className="help-key" aria-label="Production guide" onClick={() => setGuideOpen(true)}>
              i
            </button>
            <button
              type="button"
              className="demo-key"
              aria-label="Run production demo"
              onClick={() => {
                onLoadDemoArrangement();
                setStatusMessage("Demo arrangement loaded.");
              }}
            >
              demo
            </button>
            <button type="button" className="transport-key" aria-label="Back to NoteMaker" onClick={onBack}>
              notemaker
            </button>
            <button type="button" className="transport-key" aria-label={playing ? "Stop arrangement" : "Play arrangement"} onClick={playing ? onStop : onPlay}>
              {playing ? "stop" : "play"}
            </button>
            <button
              type="button"
              className="transport-key"
              aria-label="Reset arrangement"
              onClick={() => {
                onResetArrangement();
                setStatusMessage("Arrangement cleared.");
              }}
            >
              reset
            </button>
          </div>
        </header>
        {statusMessage ? <p className="production-status">{statusMessage}</p> : null}

        <section className="production-source-panel" aria-label="Pattern source strip">
          <ProductionLabel index="1" title="Pattern source" body="pick a loop, then place it on the timeline" />
          <div className="production-pattern-strip">
            {project.patterns.map((pattern) => (
              <button
                type="button"
                key={pattern.id}
                aria-label={`Source pattern ${format2(pattern.id)}`}
                aria-pressed={pattern.id === selectedPattern.id}
                onClick={() => setSelectedPatternId(pattern.id)}
              >
                {format2(pattern.id)}
              </button>
            ))}
          </div>
        </section>

        <section className="production-arranger" aria-label="Arrangement timeline">
          <ProductionLabel index="2" title="Timeline" body="bars left to right, lanes top to bottom" />
          <div className="bar-ruler" aria-label="Bar ruler">
            <span />
            {Array.from({ length: barCount }, (_, index) => (
              <strong key={index}>{index + 1}</strong>
            ))}
          </div>
          <div className="lane-stack">
            {project.arrangement.lanes.map((lane) => (
              <ProductionLane
                key={lane.id}
                lane={lane}
                clips={project.arrangement.clips.filter((clip) => clip.laneId === lane.id)}
                patterns={project.patterns}
                selectedPatternId={selectedPattern.id}
                barCount={barCount}
                onAddClip={onAddClip}
                onMoveClip={handleDrop}
                onResizeClip={onResizeClip}
                onToggleClipMute={onToggleClipMute}
                onToggleLaneMute={onToggleLaneMute}
                onDragStart={setDraggedClipId}
              />
            ))}
          </div>
        </section>
        {guideOpen ? <ProductionGuide onClose={() => setGuideOpen(false)} /> : null}
      </section>
    </main>
  );
}

function ProductionGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="guide-backdrop">
      <section className="guide-dialog" role="dialog" aria-modal="true" aria-labelledby="production-guide-title">
        <div className="guide-header">
          <div>
            <p className="device-eyebrow">arranger guide</p>
            <h2 id="production-guide-title">How Production Works</h2>
          </div>
          <button type="button" className="help-key" aria-label="Close production guide" onClick={onClose}>
            x
          </button>
        </div>
        <div className="guide-grid">
          <GuideItem title="1. Pick a source pattern" body="Use the 01-16 source strip to choose one of the loops you already built in NoteMaker." />
          <GuideItem title="2. Place it in time" body="Click any lane and bar to place that source pattern as a clip on the arrangement timeline." />
          <GuideItem title="3. Layer lanes" body="Drums, Bass, Melody, and Texture can all play together. Multiple clips can stack in the same lane." />
          <GuideItem title="4. Repeat clips" body="Clips repeat for their length. Use + to extend, - to shorten, and M to mute one clip." />
          <GuideItem title="5. Mute sections" body="Lane mute turns off a whole role while keeping its clips in place for later." />
          <GuideItem title="6. Start fast" body="Demo loads a simple arrangement. Reset clears only Production clips, not your NoteMaker patterns." />
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

function ProductionLane({
  lane,
  clips,
  patterns,
  selectedPatternId,
  barCount,
  onAddClip,
  onMoveClip,
  onResizeClip,
  onToggleClipMute,
  onToggleLaneMute,
  onDragStart
}: {
  lane: ArrangementLane;
  clips: ArrangementClip[];
  patterns: Pattern[];
  selectedPatternId: number;
  barCount: number;
  onAddClip: (patternId: number, laneId: ArrangementLaneId, startBar: number) => void;
  onMoveClip: (laneId: ArrangementLaneId, startBar: number, clipId?: string) => void;
  onResizeClip: (clipId: string, deltaBars: number) => void;
  onToggleClipMute: (clipId: string) => void;
  onToggleLaneMute: (laneId: ArrangementLaneId) => void;
  onDragStart: (clipId: string) => void;
}) {
  const stacks = stackCounts(clips);
  return (
    <div className="production-lane">
      <div className="lane-header">
        <strong>{lane.name}</strong>
        <button type="button" aria-label={`Mute ${lane.name} lane`} aria-pressed={lane.muted} onClick={() => onToggleLaneMute(lane.id)}>
          mute
        </button>
      </div>
      <div className="lane-grid">
        {Array.from({ length: barCount }, (_, index) => {
          const stackCount = stacks.get(index) ?? 0;
          return (
            <button
              type="button"
              key={index}
              className="bar-cell"
              aria-label={`Place pattern ${format2(selectedPatternId)} on ${lane.name.toLowerCase()} bar ${format2(index + 1)}`}
              onClick={() => onAddClip(selectedPatternId, lane.id, index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                onMoveClip(lane.id, index, event.dataTransfer.getData("text/notemaker-clip"));
              }}
            >
              {stackCount > 1 ? <span aria-label={`${lane.name.toLowerCase()} lane stack ${stackCount} at bar ${format2(index + 1)}`}>{stackCount}</span> : null}
            </button>
          );
        })}
        {clips.map((clip) => {
          const pattern = patterns.find((candidate) => candidate.id === clip.patternId);
          const stackIndex = stackIndexForClip(clips, clip);
          return (
            <article
              key={clip.id}
              className={`arrangement-clip ${clip.muted ? "is-muted" : ""}`}
              style={{
                gridColumn: `${clip.startBar + 1} / span ${clip.lengthBars}`,
                gridRow: stackIndex + 1
              }}
            >
              <button
                type="button"
                draggable
                aria-label={`Clip P${format2(clip.patternId)} ${lane.name.toLowerCase()} bar ${format2(clip.startBar + 1)} length ${clip.lengthBars}${clip.muted ? " muted" : ""}`}
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/notemaker-clip", clip.id);
                  onDragStart(clip.id);
                }}
              >
                <strong>P{format2(clip.patternId)}</strong>
                <MiniPatternStrip pattern={pattern} />
              </button>
              <div className="clip-actions">
                <button type="button" aria-label={`Shorten clip P${format2(clip.patternId)} ${lane.name.toLowerCase()} bar ${format2(clip.startBar + 1)}`} onClick={() => onResizeClip(clip.id, -1)}>
                  -
                </button>
                <button type="button" aria-label={`Mute clip P${format2(clip.patternId)} ${lane.name.toLowerCase()} bar ${format2(clip.startBar + 1)}`} aria-pressed={clip.muted} onClick={() => onToggleClipMute(clip.id)}>
                  m
                </button>
                <button type="button" aria-label={`Extend clip P${format2(clip.patternId)} ${lane.name.toLowerCase()} bar ${format2(clip.startBar + 1)}`} onClick={() => onResizeClip(clip.id, 1)}>
                  +
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function MiniPatternStrip({ pattern }: { pattern: Pattern | undefined }) {
  return (
    <span className="mini-pattern-strip" aria-hidden="true">
      {Array.from({ length: 16 }, (_, index) => (
        <i key={index} className={pattern?.steps[index]?.triggers.length ? "has-hit" : ""} />
      ))}
    </span>
  );
}

function ProductionLabel({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="production-label">
      <span>{index}</span>
      <strong>{title}</strong>
      <small>{body}</small>
    </div>
  );
}

function stackCounts(clips: ArrangementClip[]): Map<number, number> {
  const counts = new Map<number, number>();
  clips.forEach((clip) => {
    for (let bar = clip.startBar; bar < clip.startBar + clip.lengthBars; bar += 1) {
      counts.set(bar, (counts.get(bar) ?? 0) + 1);
    }
  });
  return counts;
}

function stackIndexForClip(clips: ArrangementClip[], clip: ArrangementClip): number {
  return clips.filter((candidate) => candidate.startBar === clip.startBar).findIndex((candidate) => candidate.id === clip.id);
}

function format2(value: number): string {
  return String(value).padStart(2, "0");
}
