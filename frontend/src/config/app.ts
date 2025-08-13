import { ApplicationError } from "@/errors";

const requiredEnvVars = ["VITE_API_BASE_URL"] as const;
// const optionalEnvVars = {} as const;

function validateConfig(): void {
  //
  const missing = requiredEnvVars.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    throw new ApplicationError(
      `Provide missing environment variables: ${missing.join(", ")}`,
    );
  }
}

validateConfig();

export const appConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
};
