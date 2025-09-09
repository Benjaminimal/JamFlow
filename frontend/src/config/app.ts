import { ApplicationError } from "@/errors";

const requiredEnvVars = ["VITE_API_BASE_URL", "VITE_LOG_LEVEL"] as const;

// TODO: Consider introducing a ConfigurationError
function validateRequired(): void {
  const missing = requiredEnvVars.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    throw new ApplicationError(
      `Provide missing environment variables: ${missing.join(", ")}`,
    );
  }
}

type LogLevel = "debug" | "info" | "warn" | "error";

function getLogLevel(level?: string): LogLevel {
  const allowedLogLevels: LogLevel[] = ["debug", "info", "warn", "error"];

  if (!level) {
    throw new ApplicationError(
      `VITE_LOG_LEVEL is not set. Must be one of: ${allowedLogLevels.join(", ")}`,
    );
  }

  const normalizedLevel = level.trim().toLowerCase() as LogLevel;
  if (!allowedLogLevels.includes(normalizedLevel)) {
    throw new ApplicationError(
      `Invalid VITE_LOG_LEVEL "${level}". Must be one of: ${allowedLogLevels.join(", ")}`,
    );
  }

  return normalizedLevel;
}

function initConfig() {
  validateRequired();

  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
    logLevel: getLogLevel(import.meta.env.VITE_LOG_LEVEL),
  };
}

export const appConfig = initConfig();
