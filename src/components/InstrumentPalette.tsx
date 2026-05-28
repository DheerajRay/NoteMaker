import { useDraggable } from "@dnd-kit/core";
import { INSTRUMENTS } from "../domain/instruments";
import type { InstrumentId, InstrumentPreset } from "../domain/types";

type InstrumentPaletteProps = {
  selectedInstrumentId: InstrumentId;
  onSelect: (instrumentId: InstrumentId) => void;
};

export function InstrumentPalette({ selectedInstrumentId, onSelect }: InstrumentPaletteProps) {
  return (
    <aside className="palette" aria-label="Instrument palette">
      <div className="panel-heading">
        <p className="eyebrow">Instrument stickers</p>
        <h2>Pick a sound</h2>
      </div>
      <div className="instrument-list">
        {INSTRUMENTS.map((instrument) => (
          <InstrumentCard
            key={instrument.id}
            instrument={instrument}
            selected={instrument.id === selectedInstrumentId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </aside>
  );
}

function InstrumentCard({
  instrument,
  selected,
  onSelect
}: {
  instrument: InstrumentPreset;
  selected: boolean;
  onSelect: (instrumentId: InstrumentId) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `instrument-${instrument.id}`,
    data: { type: "palette", instrumentId: instrument.id }
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`instrument-card ${selected ? "is-selected" : ""} ${isDragging ? "is-dragging" : ""}`}
      style={{ ...style, "--accent": instrument.color } as React.CSSProperties}
      onClick={() => onSelect(instrument.id)}
      {...listeners}
      {...attributes}
    >
      <span className="instrument-mark" aria-hidden="true" />
      <span>
        <strong>{instrument.name}</strong>
        <small>{instrument.description}</small>
      </span>
    </button>
  );
}
