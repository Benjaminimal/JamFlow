import { ConfigurationError } from "@/errors";

const requiredEnvVars = ["VITE_API_BASE_URL", "VITE_LOG_LEVEL"] as const;

function validateRequired(): void {
  const missing = requiredEnvVars.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    throw new ConfigurationError(
      `Provide missing environment variables: ${missing.join(", ")}`,
    );
  }
}

export type LogLevelName = "debug" | "info" | "warn" | "error";

function getLogLevel(level?: string): LogLevelName {
  if (import.meta.env.MODE === "test") return "error";

  const allowedLogLevels: LogLevelName[] = ["debug", "info", "warn", "error"];

  if (!level) {
    throw new ConfigurationError(
      `VITE_LOG_LEVEL is not set. Must be one of: ${allowedLogLevels.join(", ")}`,
    );
  }

  const normalizedLevel = level.trim().toLowerCase() as LogLevelName;
  if (!allowedLogLevels.includes(normalizedLevel)) {
    throw new ConfigurationError(
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
