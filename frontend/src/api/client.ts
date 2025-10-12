import axios from "axios";

import { appConfig } from "@/config/app";

export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  // TODO: find a sane value that works for large file uploads
  // timeout: 10 * 1_000, // Milliseconds
});
