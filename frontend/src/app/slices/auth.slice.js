import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../../services/auth.service.js";

export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async (credentials, thunkAPI) => {
        try {
            await authService.login(credentials);
            const response = await authService.getMe();
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message || "Login failed"
            );
        }
    }
);

export const signupUser = createAsyncThunk(
    "auth/signupUser",
    async (payload, thunkAPI) => {
        try {
            const response = await authService.signup(payload);
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data?.message || "Signup failed"
            );
        }
    }
);

export const fetchMe = createAsyncThunk(
    "auth/fetchMe",
    async (_, thunkAPI) => {
        try {
            const response = await authService.getMe();
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue("Unauthorized");
        }
    }
);

export const logoutUser = createAsyncThunk(
    "auth/logoutUser",
    async (_, thunkAPI) => {
        try {
            await authService.logout();
        } catch (error) {
            // Even if logout API fails, clear local state
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        isAuthenticated: false,
        authChecked: false,
        loading: false,
        error: null,
    },
    reducers: {
        clearAuth: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.authChecked = true;
            state.loading = false;
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.authChecked = true;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            })

            // Signup
            .addCase(signupUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signupUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.authChecked = true;
            })
            .addCase(signupUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            })

            // Fetch Me (bootstrap check)
            .addCase(fetchMe.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMe.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.authChecked = true;
            })
            .addCase(fetchMe.rejected, (state) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
                state.authChecked = true;
            })

            // Logout
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.authChecked = true;
            });
    },
});

export const { clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
