import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  type PlaybackContextType,
  usePlayback,
} from "@/contexts/PlaybackContext";
import PlaybackProvider from "@/contexts/PlaybackProvider";
import { HowlMock } from "@/test-utils/howlerMock";
import { createTestTrack } from "@/test-utils/testData";
import type { Playable } from "@/types";

vi.mock("howler", () => ({
  Howl: HowlMock,
}));

import AudioPlayerContainer from "@/components/AudioPlayerContainer";

describe("AudioPlayerContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HowlMock.reset();
  });

  describe("render states", () => {
    it("renders nothing when no track is loaded", () => {
      renderAudioPlayer();

      expect(screen.queryByTestId("audio-player")).not.toBeInTheDocument();
    });

    it("shows correct initial state when a track is loaded", async () => {
      const track = createTestTrack({ title: "New Song 1" });
      await renderAudioPlayerLoaded(track);

      await waitFor(() => {
        expect(screen.getByTestId("audio-player")).toBeInTheDocument();
      });
      expect(screen.getByText("New Song 1")).toBeInTheDocument();
      expect(screen.getByText("00:00")).toBeInTheDocument();
      expect(screen.getByText("02:03")).toBeInTheDocument();
    });

    it("shows loading indicator while track is loading", async () => {
      HowlMock.setLoadPending();
      const { setCurrentPlayable } = renderAudioPlayer();
      setCurrentPlayable(createTestTrack());

      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });

      act(() => HowlMock.resolveLoad());

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });

    it("shows error message when loading fails", async () => {
      HowlMock.setLoadError();
      const { setCurrentPlayable } = renderAudioPlayer();
      setCurrentPlayable(createTestTrack());

      await waitFor(() => {
        expect(
          screen.getByText(/audio can't be played right now/i),
        ).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: "retry" })).toBeInTheDocument();
    });
  });

  describe("controls behavior", () => {
    it("toggles pause/play correctly", async () => {
      await renderAudioPlayerLoaded();

      // Pause
      fireEvent.click(screen.getByRole("button", { name: /pause/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /play/i }),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: /pause/i }),
        ).not.toBeInTheDocument();
      });

      // Play
      fireEvent.click(screen.getByRole("button", { name: /play/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /pause/i }),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: /play/i }),
        ).not.toBeInTheDocument();
      });
    });

    it("toggles mute/unmute correctly", async () => {
      await renderAudioPlayerLoaded();

      // Mute
      fireEvent.click(screen.getByRole("button", { name: "mute" }));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "unmute" }),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: "mute" }),
        ).not.toBeInTheDocument();
      });

      // Unmute
      fireEvent.click(screen.getByRole("button", { name: "unmute" }));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "mute" }),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: "unmute" }),
        ).not.toBeInTheDocument();
      });
    });

    it("updates volume correctly", async () => {
      await renderAudioPlayerLoaded();

      fireEvent.change(screen.getByRole("slider", { name: "change volume" }), {
        target: { value: "30" },
      });

      await waitFor(() => {
        expect(
          screen.getByRole("slider", { name: "change volume" }),
        ).toHaveValue("30");
      });
    });

    it("seeks to correct position", async () => {
      await renderAudioPlayerLoaded();

      const seekSlider = screen.getByRole("slider", { name: "seek position" });
      fireEvent.change(seekSlider, { target: { value: "30000" } });

      await waitFor(() => {
        expect(screen.getByText("00:30")).toBeInTheDocument();
        expect(seekSlider).toHaveValue("30000");
      });
    });

    it("handles rapid seek correctly", async () => {
      await renderAudioPlayerLoaded();
      const seekSlider = screen.getByRole("slider", { name: "seek position" });

      fireEvent.change(seekSlider, {
        target: { value: "30000" },
      });
      await waitFor(() => {
        expect(screen.getByText("00:30")).toBeInTheDocument();
        expect(seekSlider).toHaveValue("30000");
      });

      fireEvent.change(seekSlider, {
        target: { value: "60000" },
      });
      await waitFor(() => {
        expect(screen.getByText("01:00")).toBeInTheDocument();
        expect(seekSlider).toHaveValue("60000");
      });

      fireEvent.change(seekSlider, {
        target: { value: "90000" },
      });
      await waitFor(() => {
        expect(screen.getByText("01:30")).toBeInTheDocument();
        expect(seekSlider).toHaveValue("90000");
      });
    });
  });
});

// Helper functions
function renderAudioPlayer(): PlaybackContextType {
  let hookResult: PlaybackContextType | undefined;

  const HookGrabber = () => {
    hookResult = usePlayback();
    return null;
  };

  render(
    <PlaybackProvider>
      <AudioPlayerContainer />
      <HookGrabber />
    </PlaybackProvider>,
  );

  if (!hookResult) throw new Error("Playback context not initialized");

  return hookResult;
}

async function renderAudioPlayerLoaded(
  playable?: Playable,
): Promise<PlaybackContextType> {
  playable = playable ?? createTestTrack();
  const hookResult = renderAudioPlayer();
  act(() => hookResult.setCurrentPlayable(playable));

  await waitFor(() => {
    expect(screen.getByText(playable.title)).toBeInTheDocument();
  });

  return hookResult;
}
