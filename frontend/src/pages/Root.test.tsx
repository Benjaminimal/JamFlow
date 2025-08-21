import { screen } from "@testing-library/react";

import { renderRoute } from "@/test-utils/render";

describe("Root page", () => {
  beforeEach(() => {
    renderRoute("/");
  });

  it("renders the root page", () => {
    expect(screen.getByText("JamFlow")).toBeInTheDocument();
  });

  it("renders the navigation links", () => {
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upload" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tracks" })).toBeInTheDocument();
  });
});
