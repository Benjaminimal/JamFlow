import { screen } from "@testing-library/react";
import type { Mock } from "vitest";

import { renderRoute } from "@/test-utils/render";

vi.mock("@/api/tracks", () => ({
  listTrack: vi.fn(() => Promise.resolve()),
}));

import { listTracks } from "@/api/tracks";

describe("Tracks page integration tests", () => {
  const listTracksMock = listTracks as Mock;

  describe("empty state", () => {
    it("displays that there are no tracks", () => {
      listTracksMock.mockResolvedValueOnce([]);

      renderRoute("/tracks");

      expect(screen.getByText(/nothing here/i)).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("indicates that tracks are being fetched", () => {
      // TODO: let the api mock not resolve
      renderRoute("/tracks");

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  // TODO: find out what the proper name for this state is
  describe("filled state", () => {
    it("displys all loaded tracks", () => {
      // TODO: add some real durations
      listTracksMock.mockResolvedValueOnce([
        { title: "New Song 1", recordedDate: "2025-08-10", duration: "123" },
        { title: "New Song 2", duration: "123" },
      ]);

      renderRoute("/tracks");

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
      listTracksMock.mockRejectedValueOnce(new Error("Server Error"));

      renderRoute("/tracks");

      // TODO: not sure if just notify & empty state have a special error state here
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
    //
  });
});
