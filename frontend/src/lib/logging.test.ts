import type { LogLevelName } from "@/config/app";

vi.mock("@/config/app", () => ({
  appConfig: { logLevel: "debug" },
}));

import { getLogger } from "@/lib/logging";

describe("logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each<LogLevelName>(["debug", "info", "warn", "error"])(
    "respect log level '%s'",
    (level: LogLevelName) => {
      const logger = getLogger(`TestLogLevel${level}`);
      const consoleSpy = spyOnConsoleMethod(level);

      logger[level]("This is a test message");

      expect(consoleSpy).toHaveBeenCalled();
    },
  );

  it("includes a time stamp", () => {
    const logger = getLogger("TestTimeStamp");
    const consoleDebugSpy = spyOnConsoleMethod("debug");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-02-03T12:43:54Z"));

    logger.debug("This is a debug message");

    expect(consoleDebugSpy).toHaveBeenCalled();
    const logMessage = consoleDebugSpy.mock.calls[0][0];
    expect(logMessage).toContain("2024-02-03T12:43:54.000Z");
    vi.useRealTimers();
  });

  it("includes the module name", () => {
    const logger = getLogger("TestModuleName");
    const consoleDebugSpy = spyOnConsoleMethod("debug");

    logger.debug("This is a debug message");

    expect(consoleDebugSpy).toHaveBeenCalled();
    const logMessage = consoleDebugSpy.mock.calls[0][0];
    expect(logMessage).toContain("[TestModuleName]");
  });

  it("caches logger instances per module name", () => {
    const logger1 = getLogger("TestCaching");
    const logger2 = getLogger("TestCaching");

    expect(logger1).toBe(logger2);
  });

  it("creates fresh logger instances for differing module names", () => {
    const logger1 = getLogger("TestCachingOne");
    const logger2 = getLogger("TestCachingTwo");

    expect(logger1).not.toBe(logger2);
  });
});

function spyOnConsoleMethod(method: LogLevelName) {
  return vi.spyOn(console, method).mockImplementation(() => {});
}
