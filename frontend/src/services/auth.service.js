import api from "../utils/authInterceptor.util.js";

const authService = {
    login: async (payload) => {
        const response = await api.post("/auth/login", payload);
        return response.data;
    },

    signup: async (payload) => {
        const response = await api.post("/auth/signup", payload);
        return response.data;
    },

    getMe: async () => {
        const response = await api.get("/auth/me");
        return response.data;
    },

    logout: async () => {
        const response = await api.post("/auth/logout");
        return response.data;
    },
};

export default authService;
