
import axios from "axios";

const api = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

let refreshPromise = null;

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._retry
        ) {
            return Promise.reject(error);
        }

        const excludedEndpoints = [
            "/auth/login",
            "/auth/register",
            "/auth/refresh",
            "/auth/logout",
        ];

        const isExcludedEndpoint = excludedEndpoints.some(
            (endpoint) => originalRequest.url?.includes(endpoint)
        );

        if (isExcludedEndpoint) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            if (!refreshPromise) {
                refreshPromise = api
                    .post("/auth/refresh")
                    .finally(() => {
                        refreshPromise = null;
                    });
            }

            await refreshPromise;

            return api(originalRequest);
        } catch (refreshError) {
            return Promise.reject(refreshError);
        }
    }
);

export default api;
