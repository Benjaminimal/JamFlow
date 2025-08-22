import { act, renderHook, waitFor } from "@testing-library/react";
import type { Mock } from "vitest";

import * as errorHandler from "@/api/errorHandler";
import { useTrackList } from "@/hooks/useTrackList";
import { createTestTrack } from "@/test-utils/testData";

vi.mock("@/api/tracks", () => ({
  listTracks: vi.fn(),
}));

import { listTracks } from "@/api/tracks";

describe("useTrackList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const listTracksMock = listTracks as Mock;

  it("should initialize with loading state", async () => {
    const { result } = renderHook(useTrackList);

    expect(result.current.loading).toBe(true);
    expect(result.current.tracks).toEqual([]);
    expect(result.current.errorMessage).toBeNull();
  });

  it("fetches tracks on mount", async () => {
    const tracks = Array(3).fill(null).map(createTestTrack);
    listTracksMock.mockResolvedValueOnce(tracks);

    const { result } = renderHook(useTrackList);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.errorMessage).toBe(null);
    expect(result.current.tracks).toEqual(tracks);
    expect(listTracksMock).toHaveBeenCalledOnce();
  });

  it("handles errors gracefully", async () => {
    const error = new Error("Unexpected Error");
    const mockGetUserFriendlyErrorMessage = vi
      .spyOn(errorHandler, "getUserFriendlyErrorMessage")
      .mockImplementationOnce(() => "Oops!");
    listTracksMock.mockRejectedValueOnce(error);

    const { result } = renderHook(useTrackList);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.errorMessage).toEqual("Oops!");
    expect(result.current.tracks).toEqual([]);
    expect(mockGetUserFriendlyErrorMessage).toHaveBeenCalledExactlyOnceWith(
      error,
    );
  });

  it("allows data refresh", async () => {
    listTracksMock.mockResolvedValueOnce([]);
    const { result } = renderHook(useTrackList);

    const tracks = [createTestTrack()];
    listTracksMock.mockReset();
    listTracksMock.mockResolvedValueOnce(tracks);

    await act(async () => {
      result.current.fetchData();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.errorMessage).toBe(null);
    expect(result.current.tracks).toEqual(tracks);
    expect(listTracksMock).toHaveBeenCalledOnce();
  });
});
