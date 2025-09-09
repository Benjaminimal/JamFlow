import { appConfig } from "@/config/app";

export const LogLevel = {
  Debug: 1,
  Info: 2,
  Warn: 3,
  Error: 4,
} as const;

const LogLevelNameToInt = {
  debug: LogLevel.Debug,
  info: LogLevel.Info,
  warn: LogLevel.Warn,
  error: LogLevel.Error,
};

const logLevel = LogLevelNameToInt[appConfig.logLevel];

export type Logger = {
  debug: (...data: unknown[]) => void;
  info: (...data: unknown[]) => void;
  warn: (...data: unknown[]) => void;
  error: (...data: unknown[]) => void;
};

const loggers: Map<string, Logger> = new Map();

function createLogger(moduleName: string): Logger {
  const getPrefix = () => {
    const timeStamp = new Date().toISOString();
    return `${timeStamp} [${moduleName}]`;
  };

  return {
    debug: (...data) => {
      if (logLevel <= LogLevel.Debug) {
        console.debug(getPrefix(), ...data);
      }
    },

    info: (...data) => {
      if (logLevel <= LogLevel.Info) {
        console.info(getPrefix(), ...data);
      }
    },
    warn: (...data) => {
      if (logLevel <= LogLevel.Warn) {
        console.warn(getPrefix(), ...data);
      }
    },
    error: (...data) => {
      if (logLevel <= LogLevel.Error) {
        console.error(getPrefix(), ...data);
      }
    },
  };
}

export function getLogger(moduleName: string): Logger {
  if (loggers.has(moduleName)) {
    return loggers.get(moduleName)!;
  }

  const logger = createLogger(moduleName);
  loggers.set(moduleName, logger);

  return logger;
}
