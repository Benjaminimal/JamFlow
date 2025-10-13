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
      const { result } = await renderHookIdle();

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
      expect(howlMock.play).toHaveBeenCalledTimes(1);
    });

    it("handles load error gracefully", async () => {
      HowlMock.setLoadError({ id: 0, error: 2 });
      const { result } = await renderHookIdle();

      act(() => result.current.actions.load(createTestTrack()));

      await waitFor(() => {
        expect(result.current.state.status).toBe("error");
        expect(result.current.state.errorMessage).toContain("network");
      });
    });

    it("handles load play gracefully", async () => {
      const { result } = await renderHookPlaying();
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
      const { result } = await renderHookLoading();
      const howlMock = HowlMock.getRecent();
      act(() => howlMock.resolveLoad());

      expect(result.current.state.status).toBe("playing");
      expect(howlMock.play).toHaveBeenCalledTimes(1);
    });

    it("cleans up the howl instance on new load", async () => {
      const { result } = await renderHookPlaying();
      const howlMock = HowlMock.getRecent();

      act(() => result.current.actions.load(createTestTrack()));
      expect(howlMock.unload).toHaveBeenCalledTimes(1);
    });

    it("cleans up the howl instance on unload", async () => {
      const { unmount } = await renderHookPlaying();
      const howlMock = HowlMock.getRecent();

      act(() => unmount());
      expect(howlMock.unload).toHaveBeenCalledTimes(1);
    });
  });

  describe("actions", () => {
    it("pauses on pause action", async () => {
      const { result } = await renderHookPaused();
      const howlMock = HowlMock.getRecent();

      act(() => result.current.actions.pause());
      expect(result.current.state.status).toBe("paused");
      expect(howlMock.pause).toHaveBeenCalledTimes(1);
    });

    it("plays on play action", async () => {
      const { result } = await renderHookPlaying();
      const howlMock = HowlMock.getRecent();

      act(() => result.current.actions.play());
      expect(result.current.state.status).toBe("playing");
      expect(howlMock.play).toHaveBeenCalledTimes(1);
    });

    it("seeks correctly, clamping to bounds", async () => {
      const { result } = await renderHookPlaying();
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

    it("seeks while paused", async () => {
      const { result } = await renderHookPaused();
      const howlMock = HowlMock.getRecent();
      howlMock.seek.mockReset();

      act(() => result.current.actions.seek(5000));
      expect(result.current.state.seekTarget).toBe(5000);
      expect(howlMock.seek).toHaveBeenCalledTimes(1);
    });

    it("handles double seek to the same position", async () => {
      const { result } = await renderHookPlaying();
      const howlMock = HowlMock.getRecent();
      howlMock.seek.mockReset();

      act(() => result.current.actions.seek(5000));
      act(() => result.current.actions.seek(5000));

      expect(howlMock.seek).toHaveBeenCalledTimes(2);
    });

    it("mutes on mute action", async () => {
      const { result } = await renderHookPlaying();
      const howlMock = HowlMock.getRecent();

      expect(result.current.state.isMuted).toBe(false);

      act(() => result.current.actions.mute());

      expect(result.current.state.isMuted).toBe(true);
      expect(howlMock.mute).toHaveBeenCalledWith(true);
    });

    it("unmutes on unmute action", async () => {
      const { result } = await renderHookPlaying();
      const howlMock = HowlMock.getRecent();

      act(() => result.current.actions.mute());
      expect(result.current.state.isMuted).toBe(true);

      act(() => result.current.actions.unmute());

      expect(result.current.state.isMuted).toBe(false);
      expect(howlMock.mute).toHaveBeenCalledWith(false);
    });

    it("loops on loop action", async () => {
      const { result } = await renderHookPlaying();
      const howlMock = HowlMock.getRecent();

      act(() => result.current.actions.loop());
      expect(result.current.state.isLooping).toBe(true);
      expect(howlMock.loop).toHaveBeenCalledWith(true);
    });

    it("unloops on unloop action", async () => {
      const { result } = await renderHookPlaying();
      const howlMock = HowlMock.getRecent();

      act(() => result.current.actions.loop());
      expect(result.current.state.isLooping).toBe(true);

      act(() => result.current.actions.unloop());

      expect(result.current.state.isLooping).toBe(false);
      expect(howlMock.loop).toHaveBeenCalledWith(false);
    });

    it("sets volume with clamping", async () => {
      const { result } = await renderHookPlaying();
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

    it("does nothing on play action while idle", async () => {
      const { result } = await renderHookIdle();

      act(() => result.current.actions.play());

      expect(result.current.state.status).toBe("idle");
      expect(HowlMock.count()).toBe(0);
    });

    it("does nothing on pause while idle", async () => {
      const { result } = await renderHookIdle();

      act(() => result.current.actions.pause());

      expect(result.current.state.status).toBe("idle");
      expect(HowlMock.count()).toBe(0);
    });

    it("discards double load on the same playable", async () => {
      const track = createTestTrack();
      const { result } = await renderHookLoading(track);
      const currentHowlMock = HowlMock.getRecent();
      expect(HowlMock.count()).toBe(1);

      act(() => result.current.actions.load(track));

      expect(result.current.state.status).toBe("loading");
      expect(HowlMock.count()).toBe(1);
      expect(HowlMock.getRecent()).toBe(currentHowlMock);
    });

    it("loads new playable on load while loading", async () => {
      const { result } = await renderHookLoading();
      const firstHowlMock = HowlMock.getRecent();
      expect(HowlMock.count()).toBe(1);

      const newTrack = createTestTrack();
      act(() => result.current.actions.load(newTrack));

      expect(result.current.state.status).toBe("loading");
      expect(result.current.state.playable).toEqual(newTrack);
      expect(HowlMock.count()).toBe(2);
      expect(HowlMock.getRecent()).not.toBe(firstHowlMock);
      expect(firstHowlMock.unload).toHaveBeenCalledTimes(1);
    });
  });

  describe("derived", () => {
    it("isIdle reflects status", async () => {
      const { result } = await renderHookIdle();
      expect(result.current.derived).toEqual({
        isIdle: true,
        isLoading: false,
        isPlaying: false,
        isPaused: false,
        isError: false,
      });
    });
    it("isLoading reflects status", async () => {
      const { result } = await renderHookLoading();
      expect(result.current.derived).toEqual({
        isIdle: false,
        isLoading: true,
        isPlaying: false,
        isPaused: false,
        isError: false,
      });
    });
    it("isPlaying reflects status", async () => {
      const { result } = await renderHookPlaying();
      expect(result.current.derived).toEqual({
        isIdle: false,
        isLoading: false,
        isPlaying: true,
        isPaused: false,
        isError: false,
      });
    });
    it("isPaused reflects status", async () => {
      const { result } = await renderHookPaused();
      expect(result.current.derived).toEqual({
        isIdle: false,
        isLoading: false,
        isPlaying: false,
        isPaused: true,
        isError: false,
      });
    });
    it("isError reflects status", async () => {
      const { result } = await renderHookErrored();
      expect(result.current.derived).toEqual({
        isIdle: false,
        isLoading: false,
        isPlaying: false,
        isPaused: false,
        isError: true,
      });
    });
  });

  describe("position", () => {
    it("updates getPosition while playing", async () => {
      const { result } = await renderHookPlaying();
      const howlMock = HowlMock.getRecent();

      howlMock.seek.mockReturnValueOnce(0.5);
      await waitFor(() => {
        expect(result.current.actions.getPosition()).toBe(500);
      });

      howlMock.seek.mockReturnValueOnce(1.5);
      await waitFor(() => {
        expect(result.current.actions.getPosition()).toBe(1500);
      });
    });
  });
});

async function renderHookIdle() {
  const renderHookResult = renderHook(() => usePlayback());
  await waitFor(() => {
    expect(renderHookResult.result.current.state.status).toBe("idle");
  });
  return renderHookResult;
}

async function renderHookLoading(playable?: Playable) {
  playable = playable ?? createTestTrack();
  const renderHookResult = await renderHookIdle();
  HowlMock.setLoadPending();
  act(() => renderHookResult.result.current.actions.load(playable));
  await waitFor(() => {
    expect(renderHookResult.result.current.state.status).toBe("loading");
  });
  return renderHookResult;
}

async function renderHookPlaying(playable?: Playable) {
  const renderHookResult = await renderHookLoading(playable);
  HowlMock.getRecent().resolveLoad();
  await waitFor(() => {
    expect(renderHookResult.result.current.state.status).toBe("playing");
  });
  return renderHookResult;
}

async function renderHookPaused(playable?: Playable) {
  const renderHookResult = await renderHookPlaying(playable);
  act(() => renderHookResult.result.current.actions.pause());
  await waitFor(() => {
    expect(renderHookResult.result.current.state.status).toBe("paused");
  });
  return renderHookResult;
}

async function renderHookErrored(
  playable?: Playable,
  error = { id: 0, error: 3 },
) {
  const renderHookResult = await renderHookPlaying(playable);
  const howlMock = HowlMock.getRecent();
  act(() => howlMock.triggerPlayError(error));
  await waitFor(() => {
    expect(renderHookResult.result.current.state.status).toBe("error");
  });
  return renderHookResult;
}
