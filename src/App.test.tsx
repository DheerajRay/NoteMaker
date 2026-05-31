import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("PO33 NoteMaker app", () => {
  beforeEach(() => window.localStorage.clear());

  it("renders the PO33-style device surface", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /notemaker/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/lcd status/i)).toHaveTextContent(/pattern 01/i);
    expect(screen.getByLabelText(/8-bit sample animation/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /slot 01/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /write mode/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("grid", { name: /timeline/i })).not.toBeInTheDocument();
  });

  it("selects a slot and writes a step", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /slot 09/i }));
    fireEvent.click(screen.getByRole("button", { name: /write mode/i }));
    fireEvent.click(screen.getByRole("button", { name: /step 05/i }));

    expect(screen.getByLabelText(/lcd status/i)).toHaveTextContent(/slot 09/i);
    expect(screen.getByRole("button", { name: /step 05/i })).toHaveAttribute("aria-pressed", "true");
  });

  it("opens and closes the tool guide dialog", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /open tool guide/i }));

    expect(screen.getByRole("dialog", { name: /how notemaker works/i })).toBeInTheDocument();
    expect(screen.getByText(/turn write on, then click steps/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close tool guide/i }));

    expect(screen.queryByRole("dialog", { name: /how notemaker works/i })).not.toBeInTheDocument();
  });
});
