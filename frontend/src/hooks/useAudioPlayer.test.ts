import { act, renderHook, waitFor } from "@testing-library/react";

import { HowlMock } from "@/test-utils/howlerMock";
import { createTestTrack } from "@/test-utils/testData";

vi.mock("howler", () => ({
  Howl: HowlMock,
}));
import type { Playable } from "@/contexts/playback/types";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

describe("useAudioPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HowlMock.reset();
  });

  it("starts idle and loads a track correctly", async () => {
    const track = createTestTrack();
    const { result } = renderHook(() => useAudioPlayer());

    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.playable).toBeNull();

    HowlMock.setLoadPending();
    act(() => result.current.load(track));
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
    const { result } = renderHook(() => useAudioPlayer());

    act(() => result.current.load(createTestTrack()));

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

  it("toggles play/pause state", async () => {
    const { result } = await renderHookWithPlayingAudio();
    const howlMock = HowlMock.getRecent();
    expect(howlMock.play).toHaveBeenCalled();

    act(() => result.current.togglePlay());
    expect(result.current.state.status).toBe("paused");
    expect(howlMock.pause).toHaveBeenCalled();

    act(() => result.current.togglePlay());
    expect(result.current.state.status).toBe("playing");
    expect(howlMock.play).toHaveBeenCalledTimes(2);
  });

  it("seeks correctly, clamping to bounds", async () => {
    const { result } = await renderHookWithPlayingAudio();
    const howlMock = HowlMock.getRecent();

    act(() => result.current.seek(5000));
    expect(result.current.state.seekTarget).toBe(5000);
    expect(howlMock.seek).toHaveBeenCalledWith(5);

    act(() => result.current.seek(-1000));
    expect(result.current.state.seekTarget).toBe(0);
    expect(howlMock.seek).toHaveBeenCalledWith(0);

    act(() => result.current.seek(999999));
    expect(result.current.state.seekTarget).toBe(result.current.state.duration);
    expect(howlMock.seek).toHaveBeenCalledWith(howlMock.duration());
  });

  it("toggles mute on/off", async () => {
    const { result } = await renderHookWithPlayingAudio();
    const howlMock = HowlMock.getRecent();

    expect(result.current.state.isMuted).toBe(false);

    act(() => result.current.toggleMute());

    expect(result.current.state.isMuted).toBe(true);
    expect(howlMock.mute).toHaveBeenCalledWith(true);

    act(() => result.current.toggleMute());

    expect(result.current.state.isMuted).toBe(false);
    expect(howlMock.mute).toHaveBeenCalledWith(false);
  });

  it("sets volume with clamping", async () => {
    const { result } = await renderHookWithPlayingAudio();
    const howlMock = HowlMock.getRecent();

    act(() => result.current.setVolume(30));
    expect(result.current.state.volume).toBe(30);
    expect(howlMock.volume).toHaveBeenCalledWith(0.3);

    act(() => result.current.setVolume(-50));
    expect(result.current.state.volume).toBe(0);
    expect(howlMock.volume).toHaveBeenCalledWith(0);

    act(() => result.current.setVolume(200));
    expect(result.current.state.volume).toBe(100);
    expect(howlMock.volume).toHaveBeenCalledWith(1);
  });

  it("syncs position while playing", async () => {
    const { result } = await renderHookWithPlayingAudio();
    const howlMock = HowlMock.getRecent();

    howlMock.seek.mockReturnValueOnce(0.5).mockReturnValueOnce(1.5);

    await waitFor(() => {
      expect(result.current.state.position).toBe(500);
    });

    await waitFor(() => {
      expect(result.current.state.position).toBe(1500);
    });
  });
});

async function renderHookWithPlayingAudio(playable?: Playable) {
  playable = playable ?? createTestTrack();
  const renderHookResult = renderHook(() => useAudioPlayer());
  act(() => renderHookResult.result.current.load(playable));
  await waitFor(() => {
    expect(renderHookResult.result.current.state.status).toBe("playing");
  });
  return renderHookResult;
}
