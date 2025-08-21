import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { Mock } from "vitest";

import { renderRoute } from "@/test-utils/render";

vi.mock("@/api/tracks", () => ({
  listTracks: vi.fn(() => Promise.resolve()),
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

      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      resolveList!([]);
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("when tracks are loaded", () => {
    it("displays all tracks with correct information", async () => {
      listTracksMock.mockResolvedValueOnce([
        {
          id: "1",
          title: "New Song 1",
          duration: 5661,
          recordedDate: new Date("2025-08-10"),
        },
        {
          id: "2",
          title: "New Song 2",
          duration: 1451,
          recordedDate: null,
        },
      ]);

      renderRoute("/tracks");

      await waitFor(() => {
        expect(screen.getAllByTestId("track-item")).toHaveLength(2);
      });

      expect(screen.getByText("New Song 1")).toBeInTheDocument();
      expect(screen.getByText("New Song 2")).toBeInTheDocument();
      expect(screen.getByTestId("track-1-date")).toHaveTextContent(
        "10/08/2025",
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
          {
            id: "1",
            title: "New Song 1",
            recordedDate: new Date("2025-08-10"),
            duration: 5661,
          },
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
});
