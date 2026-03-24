import axios from "axios";
import { store } from "../app/store.js";
import { clearAuth } from "../app/slices/auth.slice.js";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve();
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!error.response) {
            return Promise.reject(error);
        }

        const isAuthRoute =
            originalRequest.url.includes("/auth/login") ||
            originalRequest.url.includes("/auth/signup") ||
            originalRequest.url.includes("/auth/refresh");

        if (
            error.response.status === 401 &&
            !originalRequest._retry &&
            !isAuthRoute
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                processQueue(null);
                return api(originalRequest);
            } catch (err) {
                processQueue(err);
                store.dispatch(clearAuth());
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
