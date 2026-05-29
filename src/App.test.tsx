import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("NoteMaker app shell", () => {
  it("renders the pocket operator inspired sequencer workspace", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /notemaker/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play song/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/tempo/i)).toHaveValue(112);
    expect(screen.getByRole("grid", { name: /pocket session timeline/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /01 kick drums/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /pocket performance deck/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Step 1 is active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pattern 1/i })).toBeInTheDocument();
    expect(screen.getByText(/punch-in fx/i)).toBeInTheDocument();
    expect(screen.queryByText(/instrument palette/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/song inspector/i)).not.toBeInTheDocument();
  });

  it("places a selected pad sound onto the sequence grid", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /04 c2 bass/i }));
    fireEvent.click(screen.getAllByRole("gridcell", { name: "Step 18" })[1]);

    expect(screen.getByRole("button", { name: /Bumble Bass clip at step 18/i })).toBeInTheDocument();
  });
});
