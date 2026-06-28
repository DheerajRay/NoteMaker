import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { createDefaultProject } from "./domain/project";
import { useProjectStore } from "./store/useProjectStore";

describe("PO33 NoteMaker app", () => {
  beforeEach(() => {
    window.history.pushState(null, "", "/");
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
    expect(screen.queryByLabelText(/lcd status/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/lcd action animation/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/8-bit sample animation/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/tempo control/i)).toHaveTextContent(/disco/i);
    expect(screen.getByLabelText(/tempo control/i)).toHaveTextContent(/112/i);
    expect(screen.getByRole("button", { name: /hip hop tempo 90 bpm/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /techno tempo 140 bpm/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/current action/i)).toHaveTextContent(/slot 01 mono bass \+ key 01/i);
    expect(screen.getByLabelText(/beat flow timeline/i)).toBeInTheDocument();
    expect(screen.queryByText(/no notes written yet/i)).not.toBeInTheDocument();
    expect(screen.getByText(/tap chip x to remove/i)).toBeInTheDocument();
    expect(screen.getByText(/write on: tap steps/i)).toBeInTheDocument();
    expect(screen.getByText(/pick source · 01-16/i)).toBeInTheDocument();
    expect(screen.getByText(/choose the pitch that gets auditioned or written/i)).toBeInTheDocument();
    expect(screen.getByText(/switch between 16 separate loops/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sound import paused/i })).not.toBeInTheDocument();
    expect(screen.getByTitle(/import project/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export project/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/project controls/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/selected slot details/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /slot 01/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /slot 17/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /write mode/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows a compact six-knob sound editor", () => {
    render(<App />);

    expect(screen.getByLabelText(/sound controls/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^trim$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^tone$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^filter$/i })).not.toBeInTheDocument();

    for (const name of ["Start", "Length", "Pitch", "Gain", "Filter", "Res"]) {
      expect(screen.getByRole("slider", { name: new RegExp(name, "i") })).toBeInTheDocument();
    }

    fireEvent.change(screen.getByRole("slider", { name: /gain/i }), { target: { value: "1.2" } });
    expect(screen.getByRole("slider", { name: /gain/i })).toHaveValue("1.2");
  });

  it("updates knob values and readout when selecting another slot", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /next sound slot page/i }));
    fireEvent.click(screen.getByRole("button", { name: /slot 17 velvet keys melodic/i }));

    expect(screen.getByRole("slider", { name: /filter/i })).toHaveValue("0.76");
  });

  it("pages through expanded sound slots while preserving the first bank", () => {
    render(<App />);

    expect(screen.getByLabelText(/sound slots page 01-16/i)).toBeInTheDocument();
    expect(screen.getByText(/pick source · 01-16/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous sound slot page/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /slot 01 mono bass melodic/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next sound slot page/i }));

    expect(screen.getByLabelText(/sound slots page 17-32/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /slot 17 velvet keys melodic/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /slot 32 vocal chop melodic/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /slot 01 mono bass melodic/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next sound slot page/i }));

    expect(screen.getByLabelText(/sound slots page 33-48/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /slot 47 vinyl dust drum/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add sound import planned/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next sound slot page/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /previous sound slot page/i }));

    expect(screen.getByLabelText(/sound slots page 17-32/i)).toBeInTheDocument();
  });

  it("shows drum variation names on performance keys for drum slots", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /slot 09/i }));

    expect(screen.getByText(/choose a drum variation/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /key 01 sub/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /key 07 punch/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /key 16 chip/i })).toBeInTheDocument();
  });

  it("selects a slot and writes a step", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /slot 09/i }));
    fireEvent.click(screen.getByRole("button", { name: /write mode/i }));
    fireEvent.click(screen.getByRole("button", { name: /step 05/i }));

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
    expect(screen.getByRole("button", { name: /remove slot 01 mono bass from beat 01/i })).toHaveTextContent(/x/i);
    expect(screen.queryByText(/\+1/i)).not.toBeInTheDocument();
  });

  it("removes a written sound directly from the beat flow", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /write mode/i }));
    fireEvent.click(screen.getByRole("button", { name: /slot 09/i }));
    fireEvent.click(screen.getByRole("button", { name: /key 01/i }));
    fireEvent.click(screen.getByRole("button", { name: /step 01/i }));
    fireEvent.click(screen.getByRole("button", { name: /slot 10/i }));
    fireEvent.click(screen.getByRole("button", { name: /key 02/i }));
    fireEvent.click(screen.getByRole("button", { name: /step 01/i }));

    expect(screen.getByLabelText(/flow step 01 2 sounds/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /remove slot 09 kick from beat 01/i }));

    expect(screen.getByLabelText(/flow step 01 1 sounds/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove slot 09 kick from beat 01/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove slot 10 snare from beat 01/i })).toBeInTheDocument();
  });

  it("adjusts Beat Flow timing from the controls below a step", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /move beat 01 later/i }));
    fireEvent.click(screen.getByRole("button", { name: /move beat 01 later/i }));

    expect(screen.getByLabelText(/flow step 01 empty timing late 2/i)).toBeInTheDocument();
    expect(screen.getByText(/\+2/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /move beat 01 earlier/i }));

    expect(screen.getByLabelText(/flow step 01 empty timing late 1/i)).toBeInTheDocument();
  });

  it("changes tempo by category", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /techno tempo 140 bpm/i }));

    expect(screen.getByLabelText(/tempo control/i)).toHaveTextContent(/techno/i);
    expect(screen.getByRole("button", { name: /techno tempo 140 bpm/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("removes top-bar sound import until the add-sound flow is designed", async () => {
    render(<App />);

    expect(screen.queryByRole("button", { name: /sound import paused/i })).not.toBeInTheDocument();
    expect(screen.queryByTitle(/import sound/i)).not.toBeInTheDocument();
  });

  it("shows an error when a project file is malformed", async () => {
    render(<App />);

    const input = screen.getByTitle(/import project/i).querySelector("input");
    expect(input).not.toBeNull();
    const projectFile = Object.assign(new File(["{bad json"], "broken.json", { type: "application/json" }), {
      text: async () => "{bad json"
    });
    fireEvent.change(input!, { target: { files: [projectFile] } });

    expect(await screen.findByText(/could not import this project/i)).toBeInTheDocument();
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

    expect(screen.getByLabelText(/current action/i)).toHaveTextContent(/slot 09 kick \+ key 01/i);

    fireEvent.click(screen.getByRole("button", { name: /next demo step/i }));

    expect(screen.getByText(/key row chooses the pitch or slice/i)).toBeInTheDocument();
  });

  it("switches to the production timeline from the pattern bank", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /open production arranger/i }));

    expect(screen.getByRole("heading", { name: /production/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/pattern production arranger/i)).toBeInTheDocument();
    expect(screen.getByText(/drums/i)).toBeInTheDocument();
    expect(screen.getByText(/bass/i)).toBeInTheDocument();
    expect(screen.getByText(/melody/i)).toBeInTheDocument();
    expect(screen.getByText(/texture/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to notemaker/i })).toBeInTheDocument();
  });

  it("places, extends, mutes, and stacks production pattern clips", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /open production arranger/i }));
    fireEvent.click(screen.getByRole("button", { name: /source pattern 01/i }));
    fireEvent.click(screen.getByRole("button", { name: /place pattern 01 on drums bar 01/i }));

    expect(screen.getByRole("button", { name: /clip p01 drums bar 01 length 1/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /extend clip p01 drums bar 01/i }));
    expect(screen.getByRole("button", { name: /clip p01 drums bar 01 length 2/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mute clip p01 drums bar 01/i }));
    expect(screen.getByRole("button", { name: /clip p01 drums bar 01 length 2 muted/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /place pattern 01 on drums bar 01/i }));
    expect(screen.getAllByText(/P01/)).toHaveLength(2);
    expect(screen.getByLabelText(/drums lane stack 2 at bar 01/i)).toBeInTheDocument();
  });

  it("moves a production clip by desktop drag and drop", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /open production arranger/i }));
    fireEvent.click(screen.getByRole("button", { name: /source pattern 01/i }));
    fireEvent.click(screen.getByRole("button", { name: /place pattern 01 on drums bar 01/i }));

    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(type: string, value: string) {
        this.data[type] = value;
      },
      getData(type: string) {
        return this.data[type];
      }
    };
    fireEvent.dragStart(screen.getByRole("button", { name: /clip p01 drums bar 01 length 1/i }), { dataTransfer });
    fireEvent.drop(screen.getByRole("button", { name: /place pattern 01 on bass bar 03/i }), { dataTransfer });

    expect(screen.getByRole("button", { name: /clip p01 bass bar 03 length 1/i })).toBeInTheDocument();
  });
});
