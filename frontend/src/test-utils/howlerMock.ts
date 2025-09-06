type MockHowlOptions = {
  src: string[];
  onload: () => void;
  onloaderror: (id: number, error: unknown) => void;
  onplayerror: (id: number, error: unknown) => void;
};

type ErrorHandlerArgs = {
  id: number;
  error: unknown;
};

const defaultErrorArgs: ErrorHandlerArgs = {
  id: 0,
  error: "",
};

export class HowlMock {
  constructor(options: MockHowlOptions) {
    HowlMock.instances.push(this);

    this.options = options;

    const mode = HowlMock.loadMode;

    switch (mode) {
      case "success": {
        setTimeout(options.onload, 0);
        break;
      }
      case "error": {
        setTimeout(() => {
          options.onloaderror(
            HowlMock.onLoadErrorArgs.id,
            HowlMock.onLoadErrorArgs.error,
          );
        }, 0);
        break;
      }
    }
  }

  static instances: HowlMock[] = [];

  static reset() {
    HowlMock.instances = [];
    HowlMock.loadMode = "success";
    HowlMock.onLoadErrorArgs = defaultErrorArgs;
  }

  static loadMode: "success" | "error" = "success";
  static onLoadErrorArgs: ErrorHandlerArgs = defaultErrorArgs;
  static setLoadError(errorArgs: ErrorHandlerArgs) {
    HowlMock.loadMode = "error";
    HowlMock.onLoadErrorArgs = errorArgs;
  }

  triggerPlayError(errorArgs: ErrorHandlerArgs) {
    setTimeout(() => {
      this.options.onplayerror(errorArgs.id, errorArgs.error);
    }, 0);
  }

  options: MockHowlOptions;
  play = vi.fn();
  pause = vi.fn();
  seek = vi.fn(() => 0);
  duration = vi.fn(() => 123);
  mute = vi.fn();
  volume = vi.fn();
  unload = vi.fn();
}
