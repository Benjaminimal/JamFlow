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
      case "pending": {
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

  static loadMode: "success" | "pending" | "error" = "success";

  static setLoadPending() {
    HowlMock.loadMode = "pending";
  }

  static resolveLoad() {
    // TODO: why always 0?
    // TODO: scream if instance not there
    this.instances[0]?.options.onload();
  }

  static onLoadErrorArgs: ErrorHandlerArgs = defaultErrorArgs;
  static setLoadError(errorArgs?: ErrorHandlerArgs) {
    HowlMock.loadMode = "error";
    if (errorArgs) {
      HowlMock.onLoadErrorArgs = errorArgs;
    }
  }

  triggerPlayError(errorArgs: ErrorHandlerArgs) {
    setTimeout(() => {
      this.options.onplayerror(errorArgs.id, errorArgs.error);
    }, 0);
  }

  position: number = 0;

  options: MockHowlOptions;
  play = vi.fn();
  pause = vi.fn();
  seek = vi.fn((target?: number) => {
    if (target !== undefined) {
      this.position = target;
    }
    return this.position;
  });
  duration = vi.fn(() => 123);
  mute = vi.fn();
  volume = vi.fn();
  unload = vi.fn();
}
