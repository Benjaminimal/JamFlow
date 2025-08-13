import type { Mock } from "vitest";

import { uploadTrack } from "@/api/tracks";
import type { TrackCreateResponse } from "@/api/types";

vi.mock("@/api/client", () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock("@/api/errorHandler", () => ({
  mapAxiosError: vi.fn(),
}));

import apiClient from "@/api/client";
import { mapAxiosError } from "@/api/errorHandler";
import { createTestTrackForm } from "@/test-utils/testData";

describe("track api", () => {
  describe("uploadTrack", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    const createMockApiResponse = (
      overrides: Partial<TrackCreateResponse> = {},
    ): TrackCreateResponse => ({
      id: "123",
      created_at: "2025-08-12T00:00:00Z",
      updated_at: "2025-08-12T00:00:00Z",
      title: "New Song",
      duration: 180,
      format: "mp3",
      size: 1024,
      recorded_date: "2025-08-10",
      url: "http://example.com/track.mp3",
      ...overrides,
    });

    it("uses the correct form fields", async () => {
      (apiClient.post as Mock).mockResolvedValueOnce({
        data: createMockApiResponse(),
      });

      const trackForm = createTestTrackForm();
      await uploadTrack(trackForm);

      expect(apiClient.post).toHaveBeenCalledOnce();

      const [path, formData] = (apiClient.post as Mock).mock.calls[0];

      expect(path).toBe("/tracks");
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get("title")).toBe(trackForm.title);
      expect(formData.get("recorded_date")).toBe(trackForm.recordedDate);
      expect(formData.get("upload_file")).toBe(trackForm.file);
    });

    it("maps api response fields correctly to internal model", async () => {
      (apiClient.post as Mock).mockResolvedValueOnce({
        data: createMockApiResponse(),
      });

      const trackForm = createTestTrackForm();
      const track = await uploadTrack(trackForm);

      expect(track.id).toBe("123");
      expect(track.createdAt).toEqual(new Date("2025-08-12T00:00:00Z"));
      expect(track.updatedAt).toEqual(new Date("2025-08-12T00:00:00Z"));
      expect(track.title).toBe("New Song");
      expect(track.duration).toBe(180);
      expect(track.format).toBe("mp3");
      expect(track.size).toBe(1024);
      expect(track.recordedDate).toEqual(new Date("2025-08-10"));
      expect(track.url).toBe("http://example.com/track.mp3");
    });

    it("catches errors and passes them to the mapper", async () => {
      const originalError = new Error("Something went wrong");
      (apiClient.post as Mock).mockRejectedValueOnce(originalError);

      const mappedError = new Error("User friendly error translation");
      (mapAxiosError as Mock).mockReturnValueOnce(mappedError);

      const trackForm = createTestTrackForm();
      await expect(uploadTrack(trackForm)).rejects.toBe(mappedError);
      expect(mapAxiosError as Mock).toHaveBeenCalledExactlyOnceWith(
        originalError,
      );
    });

    it("handles missing recordedDate", async () => {
      const mockApiResponse = createMockApiResponse({ recorded_date: null });
      (apiClient.post as Mock).mockResolvedValueOnce({
        data: mockApiResponse,
      });

      const trackForm = createTestTrackForm({ recordedDate: null });
      const track = await uploadTrack(trackForm);

      expect(apiClient.post).toHaveBeenCalledOnce();

      const [path, formData] = (apiClient.post as Mock).mock.calls[0];

      expect(path).toBe("/tracks");
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get("title")).toBe(trackForm.title);
      expect(formData.has("recorded_date")).toBe(false);
      expect(formData.get("upload_file")).toBe(trackForm.file);
      expect(track.recordedDate).toBeNull();
    });
  });
});
