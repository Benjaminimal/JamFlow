import axios from "axios";

const apiClient = axios.create({
  // TODO: make this configurable
  baseURL: "http://localhost:8000/api/v1",
  // TODO: this might be too little for large file uploads
  timeout: 10_000, // Milliseconds
});

export default apiClient;
