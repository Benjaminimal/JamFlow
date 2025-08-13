import type { TrackCreateForm } from "@/types";

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
