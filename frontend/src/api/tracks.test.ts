import type { Mock } from "vitest";

import * as mappers from "@/api/mappers";
import { listTracks, uploadTrack } from "@/api/tracks";
import {
  createTestTrackForm,
  createTestTrackResponse,
} from "@/test-utils/testData";

vi.mock("@/api/client", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock("@/api/errorHandler", () => ({
  mapAxiosError: vi.fn(),
}));

import apiClient from "@/api/client";
import { mapAxiosError } from "@/api/errorHandler";

describe("track api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mapAxiosErrorMock = mapAxiosError as Mock;

  describe("uploadTrack", () => {
    const apiClientPostMock = apiClient.post as Mock;

    it("uses the correct form fields", async () => {
      apiClientPostMock.mockResolvedValueOnce({
        data: createTestTrackResponse(),
      });

      const trackForm = createTestTrackForm();
      await uploadTrack(trackForm);

      expect(apiClient.post).toHaveBeenCalledOnce();

      const [path, formData] = apiClientPostMock.mock.calls[0];

      expect(path).toBe("/tracks");
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get("title")).toBe(trackForm.title);
      expect(formData.get("recorded_date")).toBe(trackForm.recordedDate);
      expect(formData.get("upload_file")).toBe(trackForm.file);
    });

    it("calls the mapper", async () => {
      apiClientPostMock.mockResolvedValueOnce({
        data: createTestTrackResponse(),
      });
      const mapTrackToInternalSpy = vi.spyOn(mappers, "mapTrackToInternal");

      const trackForm = createTestTrackForm();
      await uploadTrack(trackForm);

      expect(mapTrackToInternalSpy).toHaveBeenCalledOnce();

      mapTrackToInternalSpy.mockClear();
    });

    it("catches errors and passes them to the mapper", async () => {
      const originalError = new Error("Something went wrong");
      apiClientPostMock.mockRejectedValueOnce(originalError);

      const mappedError = new Error("User friendly error translation");
      mapAxiosErrorMock.mockReturnValueOnce(mappedError);

      const trackForm = createTestTrackForm();
      await expect(uploadTrack(trackForm)).rejects.toBe(mappedError);
      expect(mapAxiosErrorMock).toHaveBeenCalledExactlyOnceWith(originalError);
    });

    it("handles missing recordedDate", async () => {
      const mockApiResponse = createTestTrackResponse({ recorded_date: null });
      apiClientPostMock.mockResolvedValueOnce({
        data: mockApiResponse,
      });

      const trackForm = createTestTrackForm({ recordedDate: null });
      const track = await uploadTrack(trackForm);

      expect(apiClient.post).toHaveBeenCalledOnce();

      const [path, formData] = apiClientPostMock.mock.calls[0];

      expect(path).toBe("/tracks");
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get("title")).toBe(trackForm.title);
      expect(formData.has("recorded_date")).toBe(false);
      expect(formData.get("upload_file")).toBe(trackForm.file);
      expect(track.recordedDate).toBeNull();
    });
  });

  describe("list tracks", () => {
    const apiClientGetMock = apiClient.get as Mock;

    it("calls the mapper", async () => {
      apiClientGetMock.mockResolvedValueOnce({
        data: Array(3).fill(null).map(createTestTrackResponse),
      });
      const mapTrackToInternalSpy = vi.spyOn(mappers, "mapTrackToInternal");

      await listTracks();

      expect(mapTrackToInternalSpy).toHaveBeenCalledTimes(3);

      mapTrackToInternalSpy.mockClear();
    });

    it("catches errors and passes them to the mapper", async () => {
      const originalError = new Error("Something went wrong");
      apiClientGetMock.mockRejectedValueOnce(originalError);

      const mappedError = new Error("User friendly error translation");
      mapAxiosErrorMock.mockReturnValueOnce(mappedError);

      await expect(listTracks()).rejects.toBe(mappedError);
      expect(mapAxiosErrorMock).toHaveBeenCalledExactlyOnceWith(originalError);
    });
  });
});
