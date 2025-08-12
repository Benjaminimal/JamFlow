import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import { routes } from "@/routes";

type RenderWithRouterOptions = {
  initialEntries?: string[];
  initialIndex?: number;
};

export function renderWithRouter({
  initialEntries = ["/"],
  initialIndex = 0,
}: RenderWithRouterOptions) {
  const router = createMemoryRouter(routes, {
    initialEntries,
    initialIndex,
  });
  return render(<RouterProvider router={router} />);
}

export function renderRoute(path: string) {
  return renderWithRouter({ initialEntries: [path] });
}
