import axios from "axios";

import { appConfig } from "@/config/app";

export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  // NOTE: this might be too little for large file uploads
  timeout: 10_000, // Milliseconds
});
