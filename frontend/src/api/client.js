import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

// Request interceptor: attach Bearer token if present
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("nirikshan_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated responses cleanly
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || "";
      // Do not clear tokens or redirect on login/register credential failures
      // so the auth form can receive and display the 401 error message
      if (!url.includes("/auth/login") && !url.includes("/auth/register")) {
        localStorage.removeItem("nirikshan_token");
        localStorage.removeItem("nirikshan_user");
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
