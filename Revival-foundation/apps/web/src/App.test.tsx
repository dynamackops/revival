import { render, screen } from "@testing-library/react";

import { App } from "./App";

describe("Revival foundation", () => {
  it("introduces the product without shame-oriented language", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Revival" })).toBeInTheDocument();
    expect(screen.getByText("Bring this project back to life.")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/lazy|failed|neglected/i);
  });
});
