import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("Revival foundation", () => {
  it("introduces the product without shame-oriented language", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Revival" })).toBeInTheDocument();
    expect(screen.getByText("Bring this project back to life.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with GitHub" })).toBeDisabled();
    expect(screen.getByText("Supabase connection pending")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/lazy|failed|neglected/i);
  });
});
