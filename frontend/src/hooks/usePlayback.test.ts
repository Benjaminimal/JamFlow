import { act, renderHook, waitFor } from "@testing-library/react";

import { HowlMock } from "@/test-utils/howlerMock";
import { createTestTrack } from "@/test-utils/testData";

vi.mock("howler", () => ({
  Howl: HowlMock,
}));
import type { Playable } from "@/contexts/playback/types";
import { usePlayback } from "@/hooks/usePlayback";

describe("usePlayback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HowlMock.reset();
  });

  describe("state transitions", () => {
    it("starts idle and loads a track correctly", async () => {
      const track = createTestTrack();
      const { result } = renderHook(() => usePlayback());

      expect(result.current.state.status).toBe("idle");
      expect(result.current.state.playable).toBeNull();

      HowlMock.setLoadPending();
      act(() => result.current.actions.load(track));
      const howlMock = HowlMock.getRecent();

      expect(result.current.state.status).toBe("loading");
      expect(result.current.state.playable).toEqual(track);

      await act(async () => howlMock.resolveLoad());

      expect(result.current.state.status).toBe("playing");
      expect(result.current.state.duration).toBeGreaterThan(0);
      expect(howlMock.play).toHaveBeenCalled();
    });

    it("handles load error gracefully", async () => {
      HowlMock.setLoadError({ id: 0, error: 2 });
      const { result } = renderHook(() => usePlayback());

      act(() => result.current.actions.load(createTestTrack()));

      await waitFor(() => {
        expect(result.current.state.status).toBe("error");
        expect(result.current.state.errorMessage).toContain("network");
      });
    });

    it("handles load play gracefully", async () => {
      const { result } = await renderHookWithPlayingAudio();
      const howlMock = HowlMock.getRecent();

      act(() => howlMock.triggerPlayError({ id: 0, error: 3 }));

      await waitFor(() => {
        expect(result.current.state.status).toBe("error");
        expect(result.current.state.errorMessage).toContain(
          "audio can't be played",
        );
      });
    });

    it("starts playing right after load", async () => {
      const { result } = await renderHookWithPlayingAudio();
      const howlMock = HowlMock.getRecent();
      expect(result.current.state.status).toBe("playing");
      expect(howlMock.play).toHaveBeenCalled();
    });
  });

  describe("actions", () => {
    it("pauses on pause action", async () => {
      const { result } = await renderHookWithPausedAudio();
      const howlMock = HowlMock.getRecent();

      act(() => result.current.actions.pause());
      expect(result.current.state.status).toBe("paused");
      expect(howlMock.pause).toHaveBeenCalled();
    });

    it("plays on play action", async () => {
      const { result } = await renderHookWithPlayingAudio();
      const howlMock = HowlMock.getRecent();

      act(() => result.current.actions.play());
      expect(result.current.state.status).toBe("playing");
      expect(howlMock.play).toHaveBeenCalled();
    });

    it("seeks correctly, clamping to bounds", async () => {
      const { result } = await renderHookWithPlayingAudio();
      const howlMock = HowlMock.getRecent();

      act(() => result.current.actions.seek(5000));
      expect(result.current.state.seekTarget).toBe(5000);
      expect(howlMock.seek).toHaveBeenCalledWith(5);

      act(() => result.current.actions.seek(-1000));
      expect(result.current.state.seekTarget).toBe(0);
      expect(howlMock.seek).toHaveBeenCalledWith(0);

      act(() => result.current.actions.seek(999999));
      expect(result.current.state.seekTarget).toBe(
        result.current.state.duration,
      );
      expect(howlMock.seek).toHaveBeenCalledWith(howlMock.duration());
    });

    it("mutes on mute action", async () => {
      const { result } = await renderHookWithPlayingAudio();
      const howlMock = HowlMock.getRecent();

      expect(result.current.state.isMuted).toBe(false);

      act(() => result.current.actions.mute());

      expect(result.current.state.isMuted).toBe(true);
      expect(howlMock.mute).toHaveBeenCalledWith(true);
    });

    it("unmutes on unmute action", async () => {
      const { result } = await renderHookWithPlayingAudio();
      const howlMock = HowlMock.getRecent();

      act(() => result.current.actions.mute());
      expect(result.current.state.isMuted).toBe(true);

      act(() => result.current.actions.unmute());

      expect(result.current.state.isMuted).toBe(false);
      expect(howlMock.mute).toHaveBeenCalledWith(false);
    });

    it("sets volume with clamping", async () => {
      const { result } = await renderHookWithPlayingAudio();
      const howlMock = HowlMock.getRecent();

      act(() => result.current.actions.setVolume(30));
      expect(result.current.state.volume).toBe(30);
      expect(howlMock.volume).toHaveBeenCalledWith(0.3);

      act(() => result.current.actions.setVolume(-50));
      expect(result.current.state.volume).toBe(0);
      expect(howlMock.volume).toHaveBeenCalledWith(0);

      act(() => result.current.actions.setVolume(200));
      expect(result.current.state.volume).toBe(100);
      expect(howlMock.volume).toHaveBeenCalledWith(1);
    });
  });

  describe("position", () => {
    it("syncs position while playing", async () => {
      const { result } = await renderHookWithPlayingAudio();
      const howlMock = HowlMock.getRecent();

      howlMock.seek.mockReturnValueOnce(0.5).mockReturnValueOnce(1.5);

      await waitFor(() => {
        expect(result.current.actions.getPosition()).toBe(500);
      });

      await waitFor(() => {
        expect(result.current.actions.getPosition()).toBe(1500);
      });
    });
  });
});

async function renderHookWithPlayingAudio(playable?: Playable) {
  playable = playable ?? createTestTrack();
  const renderHookResult = renderHook(() => usePlayback());
  act(() => renderHookResult.result.current.actions.load(playable));
  await waitFor(() => {
    expect(renderHookResult.result.current.state.status).toBe("playing");
  });
  return renderHookResult;
}

async function renderHookWithPausedAudio(playable?: Playable) {
  const renderHookResult = await renderHookWithPlayingAudio(playable);
  act(() => renderHookResult.result.current.actions.pause());
  await waitFor(() => {
    expect(renderHookResult.result.current.state.status).toBe("paused");
  });
  return renderHookResult;
}
