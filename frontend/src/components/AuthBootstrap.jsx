import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe, clearAuth } from "../app/slices/auth.slice.js";

const AuthBootstrap = ({ children }) => {
    const dispatch = useDispatch();
    const { authChecked } = useSelector((state) => state.auth);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                await dispatch(fetchMe()).unwrap();
            } catch {
                dispatch(clearAuth());
            }
        };

        initializeAuth();
    }, [dispatch]);

    if (!authChecked) {
        return (
            <div className="auth-bootstrap-loader">
                <div className="bootstrap-spinner" />
                <p>Initializing VC FileShare…</p>
            </div>
        );
    }

    return <>{children}</>;
};

export default AuthBootstrap;
