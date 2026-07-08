import axios from "axios";
import type { AuthSession } from "./auth";

const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_URL,
});

// Request Interceptor: Inject Access Token
apiClient.interceptors.request.use(
  (config) => {
    try {
      const sessionRaw = sessionStorage.getItem("trai.auth.session");
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw) as AuthSession;
        if (session.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
      }
    } catch (error) {
      console.error("Error reading session in request interceptor:", error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Token Refresh on 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and request has not already been retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const sessionRaw = sessionStorage.getItem("trai.auth.session");
        if (!sessionRaw) throw new Error("No active session found");
        const session = JSON.parse(sessionRaw) as AuthSession;

        const refreshRes = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: session.refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = refreshRes.data;

        const updatedSession: AuthSession = {
          ...session,
          accessToken,
          refreshToken: newRefreshToken,
        };
        sessionStorage.setItem("trai.auth.session", JSON.stringify(updatedSession));

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Invalidate session on failure and redirect to login
        sessionStorage.removeItem("trai.auth.session");
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
