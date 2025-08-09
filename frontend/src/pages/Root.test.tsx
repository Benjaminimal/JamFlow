import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Root from "@/pages/Root";

test("render JamFlow header", () => {
  render(
    <MemoryRouter>
      <Root />
    </MemoryRouter>,
  );
  const headerElement = screen.getByText("JamFlow");
  expect(headerElement).toBeInTheDocument();
});
