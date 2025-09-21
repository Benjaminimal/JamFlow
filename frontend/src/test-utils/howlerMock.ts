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

  private static instances: HowlMock[] = [];

  static getRecent(): HowlMock {
    if (this.instances.length === 0) {
      throw new Error("No HowlMock instances exist");
    }
    return this.instances[this.instances.length - 1];
  }

  static count(): number {
    return this.instances.length;
  }

  static reset() {
    HowlMock.instances = [];
    HowlMock.loadMode = "success";
    HowlMock.onLoadErrorArgs = defaultErrorArgs;
  }

  static loadMode: "success" | "pending" | "error" = "success";

  static setLoadPending() {
    HowlMock.loadMode = "pending";
  }

  static onLoadErrorArgs: ErrorHandlerArgs = defaultErrorArgs;
  static setLoadError(errorArgs?: ErrorHandlerArgs) {
    HowlMock.loadMode = "error";
    if (errorArgs) {
      HowlMock.onLoadErrorArgs = errorArgs;
    }
  }

  resolveLoad() {
    this.options.onload();
  }

  triggerPlayError(errorArgs: ErrorHandlerArgs) {
    setTimeout(() => {
      this.options.onplayerror(errorArgs.id, errorArgs.error);
    }, 0);
  }

  private position: number = 0;

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
  loop = vi.fn();
  volume = vi.fn();
  unload = vi.fn();
}
