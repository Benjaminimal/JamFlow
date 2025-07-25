import { render, screen } from "@testing-library/react";

import Upload from "./Upload";

test("render Upload page", () => {
  render(<Upload />);
  const headerElement = screen.getByText("Upload Page");
  expect(headerElement).toBeInTheDocument();
});
