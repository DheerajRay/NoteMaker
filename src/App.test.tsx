import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { createDefaultProject } from "./domain/project";
import { useProjectStore } from "./store/useProjectStore";

describe("PO33 NoteMaker app", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useProjectStore.setState({
      project: createDefaultProject(),
      selectedKeyIndex: 1,
      importError: null
    });
  });

  it("renders the PO33-style device surface", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /notemaker/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/lcd status/i)).toHaveTextContent(/pattern 01/i);
    expect(screen.getByLabelText(/lcd action animation/i)).toHaveTextContent(/slot 01 key 01 ready/i);
    expect(screen.getByLabelText(/8-bit sample animation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tempo control/i)).toHaveTextContent(/disco/i);
    expect(screen.getByLabelText(/tempo control/i)).toHaveTextContent(/112/i);
    expect(screen.getByRole("button", { name: /hip hop tempo 90 bpm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /techno tempo 140 bpm/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/current action/i)).toHaveTextContent(/slot 01 mono bass \+ key 01/i);
    expect(screen.getByLabelText(/beat flow timeline/i)).toBeInTheDocument();
    expect(screen.getByText(/no notes written yet/i)).toBeInTheDocument();
    expect(screen.getByText(/loop overview/i)).toBeInTheDocument();
    expect(screen.getByText(/write mode on: click 1-16/i)).toBeInTheDocument();
    expect(screen.getByText(/choose the sound source/i)).toBeInTheDocument();
    expect(screen.getByText(/choose the pitch or slice/i)).toBeInTheDocument();
    expect(screen.getByText(/switch between 16 separate loops/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /slot 01/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /write mode/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("selects a slot and writes a step", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /slot 09/i }));
    fireEvent.click(screen.getByRole("button", { name: /write mode/i }));
    fireEvent.click(screen.getByRole("button", { name: /step 05/i }));

    expect(screen.getByLabelText(/lcd status/i)).toHaveTextContent(/slot 09/i);
    expect(screen.getByLabelText(/lcd action animation/i)).toHaveTextContent(/write slot 09 key 01 step 05/i);
    expect(screen.getByLabelText(/current action/i)).toHaveTextContent(/write on/i);
    expect(screen.getByLabelText(/flow step 05 1 sounds/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /step 05/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows every written sound in a beat flow step", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /write mode/i }));
    for (const [slotId, keyId] of [["01", "01"], ["02", "02"], ["03", "03"], ["04", "04"]]) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`slot ${slotId}`, "i") }));
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`key ${keyId}`, "i") }));
      fireEvent.click(screen.getByRole("button", { name: /step 01/i }));
    }

    expect(screen.getByLabelText(/flow step 01 4 sounds/i)).toBeInTheDocument();
    expect(screen.queryByText(/\+1/i)).not.toBeInTheDocument();
  });

  it("changes tempo by category", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /techno tempo 140 bpm/i }));

    expect(screen.getByLabelText(/lcd status/i)).toHaveTextContent(/bpm 140/i);
    expect(screen.getByLabelText(/tempo control/i)).toHaveTextContent(/techno/i);
    expect(screen.getByRole("button", { name: /techno tempo 140 bpm/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("opens and closes the tool guide dialog", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /open tool guide/i }));

    expect(screen.getByRole("dialog", { name: /how notemaker works/i })).toBeInTheDocument();
    expect(screen.getByText(/turn write on, then click steps/i)).toBeInTheDocument();
    expect(screen.getByText(/play is silent until events is above 0/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close tool guide/i }));

    expect(screen.queryByRole("dialog", { name: /how notemaker works/i })).not.toBeInTheDocument();
  });

  it("runs the guided button demo", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /start guided demo/i }));

    expect(screen.getByRole("dialog", { name: /guided button demo/i })).toBeInTheDocument();
    expect(screen.getByText(/slot pads are the sound bank/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show this button/i }));

    expect(screen.getByLabelText(/lcd action animation/i)).toHaveTextContent(/slot 09 key 01 ready/i);

    fireEvent.click(screen.getByRole("button", { name: /next demo step/i }));

    expect(screen.getByText(/key row chooses the pitch or slice/i)).toBeInTheDocument();
  });
});
