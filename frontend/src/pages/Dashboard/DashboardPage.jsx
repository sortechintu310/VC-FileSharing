import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logoutUser } from "../../app/slices/auth.slice.js";
import { 
    TrendingUp, Users, CheckCircle, HardDrive, 
    Upload, Share2, Search 
} from "lucide-react";
import "./DashboardPage.css";

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

/* ── Dummy data for the file sharing table ── */
const recentFiles = [
    { name: "Project_Report_Final.pdf", type: "pdf", size: "2.4 MB", date: "Mar 22, 2026", status: "verified", hash: "0x7f2c…a91e" },
    { name: "Team_Photo.png", type: "img", size: "5.1 MB", date: "Mar 21, 2026", status: "shared", hash: "0x3e8d…b42f" },
    { name: "Meeting_Notes.docx", type: "doc", size: "340 KB", date: "Mar 20, 2026", status: "verified", hash: "0x9a1b…c7d3" },
    { name: "Source_Code.zip", type: "zip", size: "18.7 MB", date: "Mar 19, 2026", status: "pending", hash: "0x4b6e…d85a" },
    { name: "Presentation_Deck.pdf", type: "pdf", size: "8.2 MB", date: "Mar 18, 2026", status: "verified", hash: "0x1c3f…e96b" },
];

const fileTypeIcons = {
    pdf: "📄",
    img: "🖼️",
    doc: "📝",
    zip: "📦",
};

export default function DashboardPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate("/login");
    };

    return (
        <div className="dashboard">
            {/* ── Top Nav ── */}
            <nav className="dash-nav">
                <div className="dash-nav-left">
                    <div className="dash-nav-logo">VC</div>
                    <span className="dash-nav-title">VC FileShare</span>
                </div>

                <div className="dash-nav-right">
                    <Link to="/profile" className="dash-nav-user" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="dash-nav-avatar">{getInitials(user?.fullName)}</div>
                        <span className="dash-nav-username">{user?.fullName || "User"}</span>
                    </Link>
                    <button className="dash-logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* ── Main Content ── */}
            <div className="dash-content">
                {/* Welcome */}
                <div className="dash-welcome">
                    <h1>
                        Welcome back, <span>{user?.fullName?.split(" ")[0] || "User"}</span>
                    </h1>
                    <p>Manage your files on the decentralized blockchain network.</p>
                </div>

                {/* Stats */}
                <div className="dash-stats">
                    <div className="dash-stat-card">
                        <div className="dash-stat-header">
                            <div className="dash-stat-icon green">
                                <TrendingUp size={20} strokeWidth={2.5} />
                            </div>
                            <span className="dash-stat-badge up">+12%</span>
                        </div>
                        <div className="dash-stat-value">24</div>
                        <div className="dash-stat-label">Total Files</div>
                    </div>

                    <div className="dash-stat-card">
                        <div className="dash-stat-header">
                            <div className="dash-stat-icon teal">
                                <Users size={20} strokeWidth={2.5} />
                            </div>
                            <span className="dash-stat-badge up">+5</span>
                        </div>
                        <div className="dash-stat-value">8</div>
                        <div className="dash-stat-label">Shared With</div>
                    </div>

                    <div className="dash-stat-card">
                        <div className="dash-stat-header">
                            <div className="dash-stat-icon gold">
                                <CheckCircle size={20} strokeWidth={2.5} />
                            </div>
                            <span className="dash-stat-badge neutral">On-chain</span>
                        </div>
                        <div className="dash-stat-value">19</div>
                        <div className="dash-stat-label">Verified Files</div>
                    </div>

                    <div className="dash-stat-card">
                        <div className="dash-stat-header">
                            <div className="dash-stat-icon bronze">
                                <HardDrive size={20} strokeWidth={2.5} />
                            </div>
                            <span className="dash-stat-badge up">Active</span>
                        </div>
                        <div className="dash-stat-value">34.5 MB</div>
                        <div className="dash-stat-label">Storage Used</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="dash-actions">
                    <button className="dash-action-btn primary">
                        <Upload size={18} strokeWidth={2} />
                        Upload File
                    </button>
                    <button className="dash-action-btn secondary">
                        <Share2 size={18} strokeWidth={2} />
                        Share via Blockchain
                    </button>
                    <button className="dash-action-btn secondary">
                        <Search size={18} strokeWidth={2} />
                        Verify File Hash
                    </button>
                </div>

                {/* Recent Files */}
                <h2 className="dash-section-title">Recent Files</h2>
                <div className="dash-files-table">
                    <table>
                        <thead>
                            <tr>
                                <th>File Name</th>
                                <th>Size</th>
                                <th>Date</th>
                                <th>Blockchain Hash</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentFiles.map((file, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <div className="dash-file-name">
                                            <div className={`dash-file-icon ${file.type}`}>
                                                {fileTypeIcons[file.type]}
                                            </div>
                                            {file.name}
                                        </div>
                                    </td>
                                    <td>{file.size}</td>
                                    <td>{file.date}</td>
                                    <td style={{ fontFamily: "'DM Sans', monospace", fontSize: 13, color: "#aaa" }}>
                                        {file.hash}
                                    </td>
                                    <td>
                                        <span className={`dash-status ${file.status}`}>
                                            <span className="dash-status-dot" />
                                            {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
