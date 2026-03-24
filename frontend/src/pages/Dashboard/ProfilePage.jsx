import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logoutUser } from "../../app/slices/auth.slice.js";
import { ArrowLeft } from "lucide-react";
import "./ProfilePage.css";

/* ── Helper: get initials ── */
const getInitials = (name) => {
    if (!name) return "U";
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

export default function ProfilePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate("/login");
    };

    return (
        <div className="profile-page">
            {/* ── Top Nav ── */}
            <nav className="profile-nav">
                <div className="profile-nav-left">
                    <Link to="/dashboard" className="back-btn">
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </Link>
                </div>

                <div className="profile-nav-right">
                    <button className="profile-logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* ── Main Content ── */}
            <div className="profile-content">
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar-large">
                            {getInitials(user?.fullName)}
                        </div>
                        <div className="profile-title">
                            <h1>{user?.fullName || "User Name"}</h1>
                            <p className="profile-role">Secure FileSharer</p>
                        </div>
                    </div>

                    <div className="profile-body">
                        <h2 className="section-title">Personal Information</h2>
                        
                        <div className="info-group">
                            <label>Full Name</label>
                            <div className="info-val">{user?.fullName || "Not Provided"}</div>
                        </div>

                        <div className="info-group">
                            <label>Email Address</label>
                            <div className="info-val">{user?.email || "Not Provided"}</div>
                        </div>

                        <div className="info-group">
                            <label>Account Status</label>
                            <div className="info-val verified">
                                <span className="status-dot"></span> Verified
                            </div>
                        </div>
                    </div>

                    <div className="profile-actions">
                        <button className="btn-edit">Edit Profile</button>
                        <button className="btn-password">Change Password</button>
                    </div>
                </div>

                <div className="profile-settings">
                    <h2 className="section-title">Security Settings</h2>
                    <div className="setting-row">
                        <div className="setting-info">
                            <h4>Two-Factor Authentication</h4>
                            <p>Enhance the security of your file transfers.</p>
                        </div>
                        <button className="btn-toggle disable">Enable</button>
                    </div>
                    
                    <div className="setting-row">
                        <div className="setting-info">
                            <h4>MetaMask Wallet Integration</h4>
                            <p>Connect your wallet for blockchain operations.</p>
                        </div>
                        <button className="btn-toggle active">Connected</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
