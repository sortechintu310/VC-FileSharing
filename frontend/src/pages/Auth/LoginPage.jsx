import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser, signupUser, clearError } from "../../app/slices/auth.slice.js";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import "./LoginPage.css";

export default function LoginPage({ defaultIsSignup = false }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const [isSignup, setIsSignup] = useState(defaultIsSignup);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, msg: "" });

    const showToast = (msg) => {
        setToast({ show: true, msg });
        setTimeout(() => setToast({ show: false, msg: "" }), 3000);
    };

    const validate = () => {
        const errs = {};
        if (isSignup && !fullName.trim()) errs.fullName = "Full name is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Please enter a valid email address.";
        if (password.length < 8) errs.password = "Password must be at least 8 characters.";
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearError());
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        try {
            if (isSignup) {
                await dispatch(signupUser({ fullName, email, password })).unwrap();
                showToast("✓ Account created! Redirecting…");
            } else {
                await dispatch(loginUser({ email, password })).unwrap();
                showToast("✓ Login successful! Redirecting…");
            }
            setTimeout(() => navigate("/dashboard"), 800);
        } catch {
            // error is handled by Redux state
        }
    };

    const toggleMode = () => {
        setIsSignup((p) => !p);
        setErrors({});
        dispatch(clearError());
    };

    return (
        <>
            <div className="login-page">
                {/* ── Brand panel ── */}
                <div className="login-brand-panel">
                    <div className="login-brand-blob-1" />
                    <div className="login-brand-blob-2" />
                    <div className="login-brand-blob-3" />

                    <div className="login-logo-row">
                        <div className="login-logo-mark">VC</div>
                        <div className="login-logo-text">
                            <strong className="login-logo-strong">VC FileShare</strong>
                            Blockchain Powered
                        </div>
                    </div>

                    <div className="login-brand-main">
                        <span className="login-brand-tag">Decentralized Storage</span>
                        <h1 className="login-brand-headline">
                            Share files with<br />
                            <span className="login-brand-em">blockchain</span><br />
                            security.
                        </h1>
                        <p className="login-brand-sub">
                            A decentralized file sharing platform powered by blockchain
                            technology — ensuring tamper-proof, encrypted, and verifiable
                            file transfers.
                        </p>
                    </div>

                    <div className="login-stats">
                        {[["256-bit", "Encryption"], ["P2P", "Transfer"], ["100%", "Immutable"]].map(([num, label]) => (
                            <div key={label} className="login-stat">
                                <div className="login-stat-num">{num}</div>
                                <div className="login-stat-label">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Form panel ── */}
                <div className="login-form-panel">
                    <div className="login-card">
                        <p className="login-eyebrow">{isSignup ? "Get Started" : "Welcome back"}</p>
                        <h2 className="login-title">{isSignup ? "Create your account" : "Sign in to continue"}</h2>
                        <p className="login-desc">
                            {isSignup
                                ? "Set up your account to start sharing files securely on the blockchain."
                                : "Enter your credentials below to access your file vault."}
                        </p>

                        {error && <div className="login-api-error">{error}</div>}

                        <form onSubmit={handleSubmit} noValidate>
                            {/* Full Name (signup only) */}
                            {isSignup && (
                                <div className="login-field">
                                    <label className="login-label">Full Name</label>
                                    <div className="login-input-wrap">
                                        <span className="login-input-icon"><User size={16} strokeWidth={1.8} /></span>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={fullName}
                                            onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: null })); }}
                                            className={`login-input${errors.fullName ? " has-error" : ""}`}
                                            autoComplete="name"
                                        />
                                    </div>
                                    {errors.fullName && <p className="login-err-msg">{errors.fullName}</p>}
                                </div>
                            )}

                            {/* Email */}
                            <div className="login-field">
                                <label className="login-label">Email address</label>
                                <div className="login-input-wrap">
                                    <span className="login-input-icon"><Mail size={16} strokeWidth={1.8} /></span>
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: null })); }}
                                        className={`login-input${errors.email ? " has-error" : ""}`}
                                        autoComplete="email"
                                    />
                                </div>
                                {errors.email && <p className="login-err-msg">{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div className="login-field">
                                <label className="login-label">Password</label>
                                <div className="login-input-wrap">
                                    <span className="login-input-icon"><Lock size={16} strokeWidth={1.8} /></span>
                                    <input
                                        type={showPw ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: null })); }}
                                        className={`login-input${errors.password ? " has-error" : ""}`}
                                        autoComplete={isSignup ? "new-password" : "current-password"}
                                    />
                                    <button type="button" className="login-toggle-pw" onClick={() => setShowPw((p) => !p)} aria-label="Toggle password">
                                        {showPw ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                                    </button>
                                </div>
                                {errors.password && <p className="login-err-msg">{errors.password}</p>}
                            </div>

                            {/* Remember / Forgot (login only) */}
                            {!isSignup && (
                                <div className="login-row">
                                    <label className="login-remember">
                                        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                                        <span className="login-remember-label">Remember me</span>
                                    </label>
                                    <button type="button" className="login-forgot">Forgot password?</button>
                                </div>
                            )}

                            <button type="submit" className="login-btn-submit" disabled={loading}>
                                {loading && <span className="btn-spinner" />}
                                {loading ? (isSignup ? "Creating account…" : "Signing in…") : (isSignup ? "Create Account" : "Sign In")}
                            </button>
                        </form>

                        <div className="login-divider">
                            <div className="login-divider-line" />
                            <span className="login-divider-txt">or</span>
                            <div className="login-divider-line" />
                        </div>

                        <button className="login-btn-sso" onClick={() => showToast("MetaMask integration coming soon!")}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a3a2a" strokeWidth="1.8">
                                <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                                <path d="M9 12l2 2 4-4" />
                            </svg>
                            Connect with MetaMask
                        </button>

                        <div className="login-toggle-mode">
                            {isSignup ? "Already have an account? " : "Don't have an account? "}
                            <button onClick={toggleMode}>
                                {isSignup ? "Sign In" : "Sign Up"}
                            </button>
                        </div>

                        <p className="login-footer">
                            <button className="login-footer-link">Help & Support</button>
                        </p>
                    </div>
                </div>
            </div>

            {/* Toast */}
            <div className={`login-toast${toast.show ? " show" : ""}`}>{toast.msg}</div>
        </>
    );
}