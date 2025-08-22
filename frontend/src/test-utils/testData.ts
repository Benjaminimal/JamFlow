import type { TrackResponse } from "@/api/types";
import type { Track, TrackCreateForm } from "@/types";

export type TestFileOptions = {
  content?: string;
  fileName?: string;
};

export function createTestFile(options: TestFileOptions = {}): File {
  const { content = "dummy content", fileName = "New Song.mp3" } = options;
  return new File([content], fileName, { type: "audio/mpeg" });
}

export function createTestTrackForm(
  overrides: Partial<TrackCreateForm> = {},
): TrackCreateForm {
  return {
    title: "New Song",
    recordedDate: "2025-08-10",
    file: createTestFile(),
    ...overrides,
  };
}

export function createTestTrackResponse(
  overrides: Partial<TrackResponse> = {},
): TrackResponse {
  return {
    id: "123",
    created_at: "2025-08-12T00:00:00Z",
    updated_at: "2025-08-12T00:00:00Z",
    title: "New Song",
    duration: 180_000,
    format: "mp3",
    size: 1024,
    recorded_date: "2025-08-10",
    url: "http://example.com/track.mp3",
    ...overrides,
  };
}

export function createTestTrack(overrides: Partial<Track> = {}) {
  return {
    id: "123",
    title: "New Song",
    duration: 180_000,
    format: "mp3",
    size: 1024,
    recordedDate: new Date("2025-08-10"),
    createdAt: new Date("2025-08-12T00:00:00Z"),
    updatedAt: new Date("2025-08-12T00:00:00Z"),
    url: "http://example.com/track.mp3",
    ...overrides,
  };
}
