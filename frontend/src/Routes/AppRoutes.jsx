import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LoginPage from "../pages/Auth/LoginPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import ProfilePage from "../pages/Dashboard/ProfilePage";
import LandingPage from "../pages/Landing/LandingPage";

function ProtectedRoute({ children }) {
    const { isAuthenticated, authChecked } = useSelector((state) => state.auth);
    if (!authChecked) return null;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
    const { isAuthenticated, authChecked } = useSelector((state) => state.auth);
    if (!authChecked) return null;
    return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <GuestRoute>
                        <LoginPage />
                    </GuestRoute>
                }
            />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/signup"
                element={
                    <GuestRoute>
                        <LoginPage defaultIsSignup={true} />
                    </GuestRoute>
                }
            />
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}