import axios from "axios";

import { appConfig } from "@/config/app";

const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  // TODO: this might be too little for large file uploads
  timeout: 10_000, // Milliseconds
});

export default apiClient;
