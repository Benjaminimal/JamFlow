import { render, screen } from "@testing-library/react";

import App from "./App";

test("renders learn react link", () => {
  render(<App />);
  const paragraphElement = screen.getByText(
    /click on the vite and react logos to learn more/i,
  );
  expect(paragraphElement).toBeInTheDocument();
});
