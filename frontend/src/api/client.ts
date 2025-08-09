import axios from "axios";

const apiClient = axios.create({
  // TODO: make this configurable
  baseURL: "http://localhost:8000/api/v1",
  timeout: 10_000, // Milliseconds
});

export default apiClient;
