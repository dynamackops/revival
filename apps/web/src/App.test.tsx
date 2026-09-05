import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { App } from "./App";
import { HOW_I_BUILD_STORAGE_KEY } from "./features/onboarding/howIBuild";

describe("Revival onboarding", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("opens How I Build from the lab entrance", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Revival" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Enter the Lab/i }));
    expect(screen.getByRole("heading", { name: "How I Build" })).toBeInTheDocument();
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
  });

  it("saves the profile locally and enters an honest empty dig site", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Enter the Lab/i }));
    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Jasmine" } });
    fireEvent.change(screen.getByLabelText(/What kinds of projects/i), { target: { value: "creative AI apps" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByLabelText(/Frameworks, languages/i), { target: { value: "React and TypeScript" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.change(screen.getByLabelText("Your product priorities"), { target: { value: "useful and beautiful" } });
    fireEvent.click(screen.getByText("Experiment"));
    fireEvent.click(screen.getByRole("button", { name: "Review my profile" }));
    fireEvent.click(screen.getByRole("button", { name: /Enter the Lab/i }));

    expect(screen.getByRole("heading", { name: "Welcome back, Jasmine." })).toBeInTheDocument();
    expect(screen.getByText("Connect to GitHub to revive your first project.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect later" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Connect later" }));
    expect(screen.getByText("No problem. The lab will wait.")).toBeInTheDocument();
    expect(screen.getByText("0 artifacts catalogued")).toBeInTheDocument();
    expect(screen.queryByText(/sample repo/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(HOW_I_BUILD_STORAGE_KEY)).toContain("creative AI apps");
  });

  it("restores a completed profile after refresh and keeps Creator Memory editable", () => {
    window.localStorage.setItem(HOW_I_BUILD_STORAGE_KEY, JSON.stringify({
      displayName: "Jasmine",
      projectTypes: "systems and creative tools",
      frameworks: "React",
      mvpSize: "focused-mvp",
      planningStyle: "shape-then-build",
      testingStyle: "critical-paths",
      productPriorities: "usefulness",
      buildInstinct: "simplify",
      extraContext: "",
      memoryIds: {},
      completedAt: "2026-09-04T00:00:00.000Z",
    }));

    render(<App />);
    expect(screen.getByRole("heading", { name: "Welcome back, Jasmine." })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Creator Memory" }));
    expect(screen.getByRole("dialog", { name: "Creator Memory" })).toBeInTheDocument();
    expect(screen.getByText("systems and creative tools")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit How I Build" }));
    expect(screen.getByText("This is how Revival understands you.")).toBeInTheDocument();
  });
});
