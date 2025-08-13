import { screen } from "@testing-library/react";

import { renderRoute } from "@/test-utils/render";

test("render JamFlow header", () => {
  renderRoute("/");
  const headerElement = screen.getByText("JamFlow");
  expect(headerElement).toBeInTheDocument();
});
