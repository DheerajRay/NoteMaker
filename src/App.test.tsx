import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("NoteMaker app shell", () => {
  it("renders the storybook sequencer workspace", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /notemaker/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play song/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/tempo/i)).toHaveValue(112);
    expect(screen.getByRole("grid", { name: /storybook song timeline/i })).toBeInTheDocument();
    expect(screen.getByText("Pocket Drums")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /pocket performance deck/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Step 1 is active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pattern 1/i })).toBeInTheDocument();
  });
});
