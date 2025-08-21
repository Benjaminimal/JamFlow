import { mapTrackToInternal } from "@/api/mappers";
import { createTestTrackResponse } from "@/test-utils/testData";

describe("api mapper", () => {
  describe("track to internal", () => {
    it("should map API response to internal model correctly", () => {
      const track = createTestTrackResponse();

      const internalTrack = mapTrackToInternal(track);

      expect(internalTrack.id).toBe("123");
      expect(internalTrack.createdAt).toEqual(new Date("2025-08-12T00:00:00Z"));
      expect(internalTrack.updatedAt).toEqual(new Date("2025-08-12T00:00:00Z"));
      expect(internalTrack.title).toBe("New Song");
      expect(internalTrack.duration).toBe(180);
      expect(internalTrack.format).toBe("mp3");
      expect(internalTrack.size).toBe(1024);
      expect(internalTrack.recordedDate).toEqual(new Date("2025-08-10"));
      expect(internalTrack.url).toBe("http://example.com/track.mp3");
    });
  });
});
