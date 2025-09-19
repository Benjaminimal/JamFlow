import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { Mock } from "vitest";

import { HowlMock } from "@/test-utils/howlerMock";
import { renderRoute } from "@/test-utils/render";
import { createTestTrack } from "@/test-utils/testData";

vi.mock("@/api/tracks", () => ({
  listTracks: vi.fn(() => Promise.resolve()),
}));

vi.mock("howler", () => ({
  Howl: HowlMock,
}));

import { listTracks } from "@/api/tracks";

describe("Tracks page", () => {
  const listTracksMock = listTracks as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when no tracks exist", () => {
    it("shows empty state message", async () => {
      listTracksMock.mockResolvedValueOnce([]);

      renderRoute("/tracks");

      await waitFor(() => {
        expect(screen.getByText(/no tracks found/i)).toBeInTheDocument();
      });
    });
  });

  describe("when loading tracks", () => {
    it("shows loading indicator", async () => {
      let resolveList: (tracks: []) => void;
      const listPromise = new Promise<[]>((resolve) => {
        resolveList = resolve;
      });
      listTracksMock.mockResolvedValueOnce(listPromise);

      renderRoute("/tracks");

      expect(
        screen.getByRole("status", { name: /loading/i }),
      ).toBeInTheDocument();

      resolveList!([]);
      await waitFor(() => {
        expect(
          screen.queryByRole("status", { name: /loading/i }),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("when tracks are loaded", () => {
    it("displays all tracks with correct information", async () => {
      const recordedDate = new Date("2025-08-10");
      listTracksMock.mockResolvedValueOnce([
        createTestTrack({
          id: "1",
          title: "New Song 1",
          duration: 5661_000,
          recordedDate,
        }),
        createTestTrack({
          id: "2",
          title: "New Song 2",
          duration: 1451_000,
          recordedDate: null,
        }),
      ]);

      renderRoute("/tracks");

      await waitFor(() => {
        expect(screen.getAllByTestId("track-item")).toHaveLength(2);
      });

      expect(screen.getByText("New Song 1")).toBeInTheDocument();
      expect(screen.getByText("New Song 2")).toBeInTheDocument();
      expect(screen.getByTestId("track-1-date")).toHaveTextContent(
        recordedDate.toLocaleDateString(),
      );
      expect(screen.queryByTestId("track-2-date")).not.toBeInTheDocument();
      expect(screen.getByTestId("track-1-duration")).toHaveTextContent(
        "1:34:21",
      );
      expect(screen.getByTestId("track-2-duration")).toHaveTextContent("24:11");
    });
  });

  describe("when loading fails", () => {
    it("shows error message", async () => {
      listTracksMock.mockRejectedValueOnce(new Error("Server Error"));

      renderRoute("/tracks");

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /retry/i }),
        ).toBeInTheDocument();
      });
    });

    it("retries loading when retry button is clicked", async () => {
      listTracksMock
        .mockRejectedValueOnce(new Error("Server Error"))
        .mockResolvedValueOnce([
          createTestTrack({
            id: "1",
            title: "New Song 1",
            recordedDate: new Date("2025-08-10"),
            duration: 5661,
          }),
        ]);

      renderRoute("/tracks");

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /retry/i }),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /retry/i }));

      await waitFor(() => {
        expect(screen.getByText("New Song 1")).toBeInTheDocument();
      });
    });
  });

  describe("audio player integration", () => {
    beforeEach(() => {
      HowlMock.reset();
    });

    it("shows audio player when track is clicked", async () => {
      listTracksMock.mockResolvedValueOnce([
        createTestTrack({
          title: "New Song 1",
        }),
      ]);

      renderRoute("/tracks");

      await waitFor(() => {
        expect(screen.getByText("New Song 1")).toBeInTheDocument();
      });

      expect(screen.queryByTestId("audio-player")).not.toBeInTheDocument();

      fireEvent.click(screen.getByText("New Song 1"));

      await waitFor(() => {
        expect(screen.getByTestId("audio-player")).toBeInTheDocument();
      });

      expect(screen.getByTestId("audio-player-title")).toHaveTextContent(
        "New Song 1",
      );
      expect(screen.getByTestId("audio-player-duration")).toBeInTheDocument();
      expect(screen.getByTestId("audio-player-position")).toBeInTheDocument();

      expect(screen.getByRole("button", { name: "pause" })).toBeInTheDocument();
      expect(
        screen.getByRole("slider", { name: "seek position" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("slider", { name: "change volume" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "mute" })).toBeInTheDocument();
    });

    it("updates player content on track switch", async () => {
      listTracksMock.mockResolvedValueOnce([
        createTestTrack({
          title: "New Song 1",
        }),
        createTestTrack({
          title: "New Song 2",
        }),
      ]);

      renderRoute("/tracks");

      await waitFor(() => {
        expect(screen.getByText("New Song 1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("New Song 1"));

      await waitFor(() => {
        expect(screen.getByTestId("audio-player")).toBeInTheDocument();
      });

      expect(screen.getByTestId("audio-player")).toHaveTextContent("Song 1");
      expect(screen.getByTestId("audio-player")).not.toHaveTextContent(
        "Song 2",
      );

      fireEvent.click(screen.getByText("New Song 2"));

      await waitFor(() => {
        expect(screen.getByTestId("audio-player")).toHaveTextContent("Song 2");
      });

      expect(screen.getByTestId("audio-player")).not.toHaveTextContent(
        "Song 1",
      );
    });

    it("persists the player across page navigation", async () => {
      listTracksMock.mockResolvedValueOnce([
        createTestTrack({
          title: "New Song 1",
        }),
      ]);

      renderRoute("/tracks");

      await waitFor(() => {
        expect(screen.getByText("New Song 1")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("New Song 1"));

      await waitFor(() => {
        expect(screen.getByTestId("audio-player")).toBeInTheDocument();
      });

      renderRoute("/");

      await waitFor(() => {
        expect(screen.getByTestId("audio-player")).toBeInTheDocument();
      });
    });
  });
});
