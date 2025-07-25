import Upload from "@pages/Upload";
import { render, screen } from "@testing-library/react";

test("render Upload page", () => {
  render(<Upload />);
  const headerElement = screen.getByText("Upload Page");
  expect(headerElement).toBeInTheDocument();
});
