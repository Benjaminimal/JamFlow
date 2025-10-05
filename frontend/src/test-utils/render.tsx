// TODO: not sure if we even need this anymore now that we're using tanstack router
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { render } from "@testing-library/react";

import { router } from "@/routes";

type RenderWithRouterOptions = {
  initialEntries?: string[];
  initialIndex?: number;
};

export function renderWithRouter({
  initialEntries = ["/"],
  initialIndex = 0,
}: RenderWithRouterOptions = {}) {
  const history = createMemoryHistory({
    initialEntries,
    initialIndex,
  });
  return render(<RouterProvider router={router} history={history} />);
}

export function renderRoute(path: string) {
  return renderWithRouter({ initialEntries: [path] });
}
