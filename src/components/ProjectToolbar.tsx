import { parseProject } from "../domain/project";
import type { Project } from "../domain/types";

type ProjectToolbarProps = {
  project: Project;
  scheduleCount: number;
  onExport: () => void;
  onImport: (project: Project) => void;
  onReset: () => void;
};

export function ProjectToolbar({ project, scheduleCount, onExport, onImport, onReset }: ProjectToolbarProps) {
  async function handleImport(file: File | undefined) {
    if (!file) return;
    const source = await file.text();
    onImport(parseProject(source));
  }

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Local-first music map</p>
        <h1>NoteMaker</h1>
      </div>
      <div className="project-status" aria-label="Project status">
        <strong>{project.title}</strong>
        <span>{project.clips.length} clips</span>
        <span>{scheduleCount} scheduled notes</span>
      </div>
      <div className="toolbar-actions">
        <button type="button" onClick={onExport}>
          Export
        </button>
        <label className="file-button">
          Import
          <input
            type="file"
            accept="application/json,.json,.notemaker"
            onChange={(event) => void handleImport(event.target.files?.[0])}
          />
        </label>
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    </header>
  );
}
