import { screen } from "@testing-library/react";

import { renderRoute } from "@/test-utils/render";

vi.mock("@/api/tracks", () => ({
  listTrack: vi.fn(() => Promise.resolve()),
}));

describe("Tracks page integration tests", () => {
  beforeEach(() => {
    renderRoute("/tracks");
  });

  describe("empty state", () => {
    it("displays that there are no tracks", () => {
      // TODO: return empty list from the mocked api

      expect(screen.getByText(/nothing here/i)).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("indicates that tracks are being fetched", () => {
      // TODO: simulate waiting for the request

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  // TODO: find out what the proper name for this state is
  describe("filled state", () => {
    it("displys all loaded tracks", () => {
      // TODO: return 2 tracks from the mocked api

      // TODO: replace these made up selectors with real ones
      expect(
        screen.queryAllByRole("title").map((el) => el.textContent),
      ).toEqual(["New Song 1", "New Song 2"]);
      expect(
        screen.queryAllByRole("recorded-on").map((el) => el.textContent),
      ).toEqual(["2025-08-10"]);
      expect(
        screen.queryAllByRole("duration").map((el) => el.textContent),
      ).toEqual(["01:32:14", "20:24"]);
    });
  });

  describe("error state", () => {
    it("displays a user friendly error message for loading errors", () => {
      // TODO: simulate an error when calling the api

      // TODO: not sure if just notify & empty state have a special error state here
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
    //
  });
});
