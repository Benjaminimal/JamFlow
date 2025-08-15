import { screen } from "@testing-library/react";

import { renderRoute } from "@/test-utils/render";

// TODO: add test for complete and functional navigation

test("render JamFlow header", () => {
  renderRoute("/");
  const headerElement = screen.getByText("JamFlow");
  expect(headerElement).toBeInTheDocument();
});
