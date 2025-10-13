import * as z from "zod";

import { ConfigurationError } from "@/errors";

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: Record<string, string>;
  }
}

const allowedLogLevels = ["debug", "info", "warn", "error"] as const;
export type LogLevelName = (typeof allowedLogLevels)[number];

/**
 * Schema with validation for runtime config.
 */
const RuntimeConfigSchema = z.object({
  API_BASE_URL: z.string().nonempty(),
  LOG_LEVEL: z
    .string()
    .nonempty()
    .transform((v) => v.trim().toLocaleLowerCase())
    .pipe(z.enum(allowedLogLevels)),
});

export type AppConfig = z.infer<typeof RuntimeConfigSchema>;

let config: AppConfig | null = null;

/**
 * Merge multiple sources for runtime config in order of precedence:
 *   1. window.__RUNTIME_CONFIG__
 *   2. Build-time env variables (import.meta.env)
 */
function getRawConfig(): Record<string, string> {
  const runtime = window.__RUNTIME_CONFIG__ ?? {};
  const buildEnv = import.meta.env || {};

  return {
    ...Object.fromEntries(
      Object.entries(buildEnv).map(([k, v]) => [k.replace(/^VITE_/, ""), v]),
    ),
    ...runtime,
  };
}

/**
 * Lazy load and validate runtime config from window.__RUNTIME_CONFIG__.
 */
export function ensureConfig(): AppConfig {
  if (config) return config;

  const raw = getRawConfig();

  try {
    config = RuntimeConfigSchema.parse(raw);
    return config;
  } catch (error) {
    throw new ConfigurationError(`Invalid runtime config: ${error}`);
  }
}

/**
 * Type-safe proxy for accessing runtime config everywhere.
 * Throws if accessed before `loadConfig()` has run.
 *
 * Usage:
 *   import { appConfig } from "@/config/app";
 *   console.log(appConfig.API_BASE_URL);
 */
export const appConfig: Readonly<AppConfig> = new Proxy<AppConfig>(
  {} as AppConfig,
  {
    get(_: AppConfig, prop: keyof AppConfig) {
      const _config = ensureConfig();
      return _config[prop];
    },
  },
);
