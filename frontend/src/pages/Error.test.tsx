import { render, screen } from "@testing-library/react";
import * as router from "react-router-dom";

vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useRouteError: vi.fn(),
}));

const mockUseRouteError = vi.mocked(router.useRouteError);

import ErrorPage from "@/pages/Error";

describe("ErrorPage", () => {
  beforeEach(() => {
    mockUseRouteError.mockReturnValue("Test error message");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders error message from useRouteError hook", () => {
    render(<ErrorPage />);

    expect(screen.getByText("Test error message")).toBeInTheDocument();
    expect(mockUseRouteError).toHaveBeenCalledOnce();
  });

  test("handles different error types from router", () => {
    const errorObject = { statusText: "Not Found", status: 404 };
    mockUseRouteError.mockReturnValue(errorObject);

    render(<ErrorPage />);

    expect(screen.getByText("Not Found")).toBeInTheDocument();
  });
});
