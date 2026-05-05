import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
    TrendingUp,
    Users,
    CheckCircle,
    HardDrive,
    Upload,
    Share2,
    Search,
    RefreshCw,
    Copy,
    Download,
    Eye,
    X,
} from "lucide-react";
import { logoutUser } from "../../app/slices/auth.slice.js";
import fileService from "../../services/file.service.js";
import "./DashboardPage.css";

const getInitials = (name) => {
    if (!name) return "U";
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

const formatBytes = (value) => {
    const bytes = Number(value || 0);
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const normalized = bytes / 1024 ** unitIndex;
    const fractionDigits = normalized >= 10 || unitIndex === 0 ? 0 : 1;
    return `${normalized.toFixed(fractionDigits)} ${units[unitIndex]}`;
};

const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
};

const shortHash = (value) => {
    if (!value || value.length < 14) return value || "-";
    return `${value.slice(0, 8)}...${value.slice(-6)}`;
};

const normalizeErrorMessage = async (error, fallback = "Request failed") => {
    const responsePayload = error?.response?.data;

    if (responsePayload instanceof Blob) {
        try {
            const text = await responsePayload.text();
            const parsed = JSON.parse(text);
            return parsed?.message || fallback;
        } catch {
            return fallback;
        }
    }

    return (
        responsePayload?.message ||
        error?.message ||
        fallback
    );
};

const parseShareCids = (rawText) =>
    String(rawText || "")
        .split(/[\n,\s]+/)
        .map((cid) => cid.trim())
        .filter(Boolean);

const DASHBOARD_TABS = [
    { id: "overview", label: "Overview" },
    { id: "operations", label: "File Operations" },
    { id: "access", label: "Access Control" },
    { id: "files", label: "My Files" },
];

const getReconstructedPreviewType = (fileName, mimeType) => {
    const normalizedName = String(fileName || "").toLowerCase();
    const extension = normalizedName.includes(".") ? normalizedName.split(".").pop() : "";
    const normalizedMimeType = String(mimeType || "").toLowerCase();

    if (extension === "pdf" || normalizedMimeType.includes("application/pdf")) return "pdf";
    if (
        normalizedMimeType.startsWith("image/") ||
        ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"].includes(extension)
    ) {
        return "image";
    }

    return null;
};

const triggerDownload = (objectUrl, fileName) => {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName || "reconstructed_file.bin";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
};

export default function DashboardPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const authUser = useSelector((state) => state.auth.user);
    const user = authUser?.data ?? authUser;

    const [files, setFiles] = useState([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [filesError, setFilesError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [uploading, setUploading] = useState(false);
    const [uploadFileInput, setUploadFileInput] = useState(null);
    const [sharesCount, setSharesCount] = useState(3);
    const [uploadError, setUploadError] = useState("");
    const [uploadResult, setUploadResult] = useState(null);

    const [grantFileId, setGrantFileId] = useState("");
    const [walletAddress, setWalletAddress] = useState("");
    const [granting, setGranting] = useState(false);
    const [grantError, setGrantError] = useState("");
    const [grantMessage, setGrantMessage] = useState("");

    const [aesKey, setAesKey] = useState("");
    const [selectedReconstructFileId, setSelectedReconstructFileId] = useState("");
    const [manualShareCids, setManualShareCids] = useState("");
    const [outputFileName, setOutputFileName] = useState("");
    const [reconstructing, setReconstructing] = useState(false);
    const [reconstructError, setReconstructError] = useState("");
    const [reconstructMessage, setReconstructMessage] = useState("");
    const [reconstructPreview, setReconstructPreview] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    const fetchFiles = useCallback(async () => {
        setFilesLoading(true);
        setFilesError("");
        try {
            const response = await fileService.getMyFiles();
            const nextFiles = Array.isArray(response) ? response : [];
            setFiles(nextFiles);

            if (!selectedReconstructFileId && nextFiles.length > 0) {
                setSelectedReconstructFileId(nextFiles[0].fileId);
                setOutputFileName((currentValue) => currentValue || nextFiles[0].fileName || "");
            }

            if (!grantFileId) {
                const uploaded = nextFiles.find((file) => file.status === "uploaded");
                if (uploaded) setGrantFileId(uploaded.fileId);
            }
        } catch (error) {
            const message = await normalizeErrorMessage(error, "Failed to fetch your files");
            setFilesError(message);
        } finally {
            setFilesLoading(false);
        }
    }, [grantFileId, selectedReconstructFileId]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    useEffect(() => {
        return () => {
            if (reconstructPreview?.url) {
                window.URL.revokeObjectURL(reconstructPreview.url);
            }
        };
    }, [reconstructPreview]);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate("/login");
    };

    const handleCopy = async (value) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            // ignore clipboard failures
        }
    };

    const handleUpload = async (event) => {
        event.preventDefault();
        setUploadError("");
        setUploadResult(null);

        if (!uploadFileInput) {
            setUploadError("Choose a file to upload");
            return;
        }

        if (!Number.isInteger(Number(sharesCount)) || Number(sharesCount) < 2 || Number(sharesCount) > 10) {
            setUploadError("sharesCount must be between 2 and 10");
            return;
        }

        setUploading(true);
        try {
            const response = await fileService.uploadFile({
                file: uploadFileInput,
                sharesCount: Number(sharesCount),
            });

            setUploadResult(response);
            setAesKey(response?.shares?.aesKey || "");
            setSelectedReconstructFileId(response?.fileId || "");
            setOutputFileName(uploadFileInput.name || "");
            await fetchFiles();
        } catch (error) {
            const message = await normalizeErrorMessage(error, "File upload failed");
            setUploadError(message);
        } finally {
            setUploading(false);
        }
    };

    const handleGrantAccess = async (event) => {
        event.preventDefault();
        setGrantError("");
        setGrantMessage("");

        if (!grantFileId) {
            setGrantError("Select a file");
            return;
        }

        if (!walletAddress.trim()) {
            setGrantError("Wallet address is required");
            return;
        }

        setGranting(true);
        try {
            const response = await fileService.grantAccess({
                fileId: grantFileId,
                walletAddress: walletAddress.trim(),
            });
            setGrantMessage(`Access granted. Tx: ${response?.txHash || "-"}`);
        } catch (error) {
            const message = await normalizeErrorMessage(error, "Grant access failed");
            setGrantError(message);
        } finally {
            setGranting(false);
        }
    };

    const handleReconstruct = async (event) => {
        event.preventDefault();
        setReconstructError("");
        setReconstructMessage("");
        setReconstructPreview(null);

        const key = aesKey.trim();
        const shareCids = parseShareCids(manualShareCids);
        const requestedOutputFileName =
            outputFileName.trim() ||
            selectedFileForPreview?.fileName ||
            "reconstructed_file";

        if (!key) {
            setReconstructError("AES key is required");
            return;
        }

        if (shareCids.length < 2 && !selectedReconstructFileId) {
            setReconstructError("Provide at least two share CIDs or select a saved file");
            return;
        }

        setReconstructing(true);
        try {
            const response = await fileService.reconstructFile({
                aesKey: key,
                shareCids,
                outputFileName: requestedOutputFileName,
                fileId: selectedReconstructFileId || null,
            });

            const objectUrl = window.URL.createObjectURL(response.blob);
            const reconstructedFileName =
                response.fileName ||
                requestedOutputFileName;
            const previewType = getReconstructedPreviewType(
                reconstructedFileName,
                response?.mimeType || response?.blob?.type
            );

            if (previewType) {
                setReconstructPreview({
                    url: objectUrl,
                    fileName: reconstructedFileName,
                    type: previewType,
                });
                setReconstructMessage("File reconstructed successfully. Preview is ready below.");
            } else {
                setReconstructPreview(null);
                triggerDownload(objectUrl, reconstructedFileName);
                window.URL.revokeObjectURL(objectUrl);
                setReconstructMessage("File reconstructed and downloaded. Preview is available only for PDF and image files.");
            }
        } catch (error) {
            const message = await normalizeErrorMessage(error, "File reconstruction failed");
            setReconstructError(message);
        } finally {
            setReconstructing(false);
        }
    };

    const filteredFiles = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return files;
        return files.filter((file) =>
            file.fileName?.toLowerCase().includes(query) ||
            file.fileId?.toLowerCase().includes(query) ||
            file.blockchainTxHash?.toLowerCase().includes(query)
        );
    }, [files, searchTerm]);

    const stats = useMemo(() => {
        const totalFiles = files.length;
        const uploadedFiles = files.filter((file) => file.status === "uploaded").length;
        const totalShares = files.reduce((sum, file) => sum + Number(file.shareCount || 0), 0);
        const totalStorage = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
        return {
            totalFiles,
            uploadedFiles,
            totalShares,
            totalStorage,
        };
    }, [files]);

    const selectedFileForPreview = useMemo(
        () => files.find((file) => file.fileId === selectedReconstructFileId) || null,
        [files, selectedReconstructFileId]
    );

    const handleReconstructFileSelection = (fileId) => {
        setSelectedReconstructFileId(fileId);
        setManualShareCids("");
        setReconstructPreview(null);

        const selectedFile = files.find((file) => file.fileId === fileId);
        setOutputFileName(selectedFile?.fileName || "");
    };

    return (
        <div className="dashboard">
            <nav className="dash-nav">
                <div className="dash-nav-left">
                    <div className="dash-nav-logo">VC</div>
                    <span className="dash-nav-title">VC FileShare</span>
                </div>

                <div className="dash-nav-right">
                    <Link to="/profile" className="dash-nav-user">
                        <div className="dash-nav-avatar">{getInitials(user?.fullName)}</div>
                        <span className="dash-nav-username">{user?.fullName || "User"}</span>
                    </Link>
                    <button className="dash-logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            <div className="dash-content">
                <section className="dash-welcome">
                    <h1>
                        Welcome back, <span>{user?.fullName?.split(" ")[0] || "User"}</span>
                    </h1>
                    <p>Upload files, split them into secure shares, and reconstruct with AES key + shares.</p>
                </section>

                <section className="dash-stats">
                    <article className="dash-stat-card">
                        <div className="dash-stat-header">
                            <div className="dash-stat-icon green">
                                <TrendingUp size={20} strokeWidth={2.2} />
                            </div>
                        </div>
                        <div className="dash-stat-value">{stats.totalFiles}</div>
                        <div className="dash-stat-label">Total Files</div>
                    </article>

                    <article className="dash-stat-card">
                        <div className="dash-stat-header">
                            <div className="dash-stat-icon teal">
                                <CheckCircle size={20} strokeWidth={2.2} />
                            </div>
                        </div>
                        <div className="dash-stat-value">{stats.uploadedFiles}</div>
                        <div className="dash-stat-label">On-Chain Uploaded</div>
                    </article>

                    <article className="dash-stat-card">
                        <div className="dash-stat-header">
                            <div className="dash-stat-icon gold">
                                <Users size={20} strokeWidth={2.2} />
                            </div>
                        </div>
                        <div className="dash-stat-value">{stats.totalShares}</div>
                        <div className="dash-stat-label">Total Shares</div>
                    </article>

                    <article className="dash-stat-card">
                        <div className="dash-stat-header">
                            <div className="dash-stat-icon bronze">
                                <HardDrive size={20} strokeWidth={2.2} />
                            </div>
                        </div>
                        <div className="dash-stat-value">{formatBytes(stats.totalStorage)}</div>
                        <div className="dash-stat-label">Storage Used</div>
                    </article>
                </section>

                <section className="dash-actions">
                    <button className="dash-action-btn primary" onClick={fetchFiles} disabled={filesLoading}>
                        <RefreshCw size={18} strokeWidth={2} />
                        {filesLoading ? "Refreshing..." : "Refresh Files"}
                    </button>
                    <button className="dash-action-btn secondary" onClick={() => handleCopy(aesKey)} disabled={!aesKey}>
                        <Copy size={18} strokeWidth={2} />
                        Copy AES Key
                    </button>
                    <button
                        className="dash-action-btn secondary"
                        onClick={() => {
                            setSelectedReconstructFileId(uploadResult?.fileId || selectedReconstructFileId);
                            setOutputFileName(uploadResult?.fileName || outputFileName);
                            setManualShareCids((uploadResult?.shares?.cids || []).join("\n"));
                        }}
                        disabled={!uploadResult?.shares?.cids?.length}
                    >
                        <Share2 size={18} strokeWidth={2} />
                        Use Latest Shares
                    </button>
                </section>

                <section className="dash-tabs" role="tablist" aria-label="Dashboard sections">
                    {DASHBOARD_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            className={`dash-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </section>

                {activeTab === "overview" && (
                    <section className="dash-overview-grid">
                        <article className="dash-panel overview-card">
                            <h3>Upload & Reconstruct</h3>
                            <p>Split files into secure shares and rebuild when needed.</p>
                            <button type="button" className="panel-submit" onClick={() => setActiveTab("operations")}>
                                Open File Operations
                            </button>
                        </article>

                        <article className="dash-panel overview-card">
                            <h3>Access Management</h3>
                            <p>Grant blockchain read access to trusted wallet addresses.</p>
                            <button type="button" className="panel-submit" onClick={() => setActiveTab("access")}>
                                Open Access Control
                            </button>
                        </article>

                        <article className="dash-panel overview-card">
                            <h3>File Library</h3>
                            <p>Search your uploaded files and track blockchain status quickly.</p>
                            <button type="button" className="panel-submit" onClick={() => setActiveTab("files")}>
                                Open My Files
                            </button>
                        </article>
                    </section>
                )}

                {activeTab === "operations" && (
                    <section className="dash-grid">
                        <article className="dash-panel">
                            <header className="panel-head">
                                <h2>Upload File</h2>
                                <span>Split + register on blockchain</span>
                            </header>

                            <form className="panel-form" onSubmit={handleUpload}>
                                <label className="panel-label">Choose File</label>
                                <input
                                    className="panel-input"
                                    type="file"
                                    onChange={(event) => setUploadFileInput(event.target.files?.[0] || null)}
                                    required
                                />

                                <label className="panel-label">Number of Shares (2-10)</label>
                                <input
                                    className="panel-input"
                                    type="number"
                                    min="2"
                                    max="10"
                                    value={sharesCount}
                                    onChange={(event) => setSharesCount(event.target.value)}
                                />

                                {uploadError && <p className="panel-error">{uploadError}</p>}

                                <button className="panel-submit" type="submit" disabled={uploading}>
                                    <Upload size={16} />
                                    {uploading ? "Uploading..." : "Upload and Split"}
                                </button>
                            </form>

                            {uploadResult && (
                                <div className="panel-result">
                                    <h3>Upload Result</h3>
                                    <p><strong>File ID:</strong> {uploadResult.fileId}</p>
                                    <p><strong>AES Key:</strong> {uploadResult?.shares?.aesKey}</p>
                                    <p><strong>Tx Hash:</strong> {uploadResult?.blockchain?.txHash}</p>

                                    <div className="result-share-list">
                                        {(uploadResult?.shares?.cids || []).map((cid, index) => (
                                            <div key={cid} className="result-share-item">
                                                <span>Share {index + 1}: {cid}</span>
                                                <button type="button" onClick={() => handleCopy(cid)}>
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </article>

                        <article className="dash-panel">
                            <header className="panel-head">
                                <h2>Reconstruct File</h2>
                                <span>Preview supported for PDF/images</span>
                            </header>

                            <form className="panel-form" onSubmit={handleReconstruct}>
                                <label className="panel-label">AES Key</label>
                                <input
                                    className="panel-input"
                                    type="text"
                                    value={aesKey}
                                    onChange={(event) => setAesKey(event.target.value)}
                                    placeholder="Paste aes_key from split response"
                                />

                                <label className="panel-label">Saved File (optional)</label>
                                <select
                                    className="panel-input"
                                    value={selectedReconstructFileId}
                                    onChange={(event) => handleReconstructFileSelection(event.target.value)}
                                >
                                    <option value="">Select saved file</option>
                                    {files.map((file) => (
                                        <option key={file.fileId} value={file.fileId}>
                                            {file.fileName} ({file.fileId})
                                        </option>
                                    ))}
                                </select>

                                <label className="panel-label">Manual Share CIDs (optional, paste all shares, comma/newline separated)</label>
                                <textarea
                                    className="panel-input panel-textarea"
                                    value={manualShareCids}
                                    onChange={(event) => setManualShareCids(event.target.value)}
                                    placeholder="QmShareCid1&#10;QmShareCid2&#10;QmShareCid3"
                                />

                                {selectedFileForPreview?.shares?.length > 0 && (
                                    <div className="panel-hint">
                                        Selected file has {selectedFileForPreview.shares.length} saved shares. If manual list is empty, backend uses all saved shares.
                                    </div>
                                )}

                                <label className="panel-label">Output Filename</label>
                                <input
                                    className="panel-input"
                                    type="text"
                                    value={outputFileName}
                                    onChange={(event) => setOutputFileName(event.target.value)}
                                    placeholder="Leave blank to use selected file name"
                                />

                                {reconstructError && <p className="panel-error">{reconstructError}</p>}
                                {reconstructMessage && <p className="panel-success">{reconstructMessage}</p>}

                                <button className="panel-submit" type="submit" disabled={reconstructing}>
                                    <Download size={16} />
                                    {reconstructing ? "Reconstructing..." : "Reconstruct File"}
                                </button>
                            </form>

                            {reconstructPreview && (
                                <div className="panel-result">
                                    <div className="preview-head">
                                        <h3>
                                            <Eye size={14} />
                                            Reconstructed Preview
                                        </h3>
                                        <div className="preview-actions">
                                            <button
                                                type="button"
                                                className="preview-btn"
                                                onClick={() => triggerDownload(reconstructPreview.url, reconstructPreview.fileName)}
                                            >
                                                <Download size={14} />
                                                Download
                                            </button>
                                            <button
                                                type="button"
                                                className="preview-btn secondary"
                                                onClick={() => setReconstructPreview(null)}
                                            >
                                                <X size={14} />
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                    <p><strong>File:</strong> {reconstructPreview.fileName}</p>

                                    {reconstructPreview.type === "pdf" ? (
                                        <iframe
                                            title={`Preview ${reconstructPreview.fileName}`}
                                            src={reconstructPreview.url}
                                            className="reconstruct-preview-frame"
                                        />
                                    ) : (
                                        <img
                                            src={reconstructPreview.url}
                                            alt={reconstructPreview.fileName}
                                            className="reconstruct-preview-image"
                                        />
                                    )}
                                </div>
                            )}
                        </article>
                    </section>
                )}

                {activeTab === "access" && (
                    <section className="dash-grid">
                        <article className="dash-panel dash-panel-wide">
                            <header className="panel-head">
                                <h2>Grant Blockchain Access</h2>
                                <span>Grant read access to another wallet</span>
                            </header>

                            <form className="panel-form panel-form-inline" onSubmit={handleGrantAccess}>
                                <div className="inline-field">
                                    <label className="panel-label">File</label>
                                    <select
                                        className="panel-input"
                                        value={grantFileId}
                                        onChange={(event) => setGrantFileId(event.target.value)}
                                    >
                                        <option value="">Select file</option>
                                        {files
                                            .filter((file) => file.status === "uploaded")
                                            .map((file) => (
                                                <option key={file.fileId} value={file.fileId}>
                                                    {file.fileName} ({file.fileId})
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="inline-field">
                                    <label className="panel-label">Wallet Address</label>
                                    <input
                                        className="panel-input"
                                        type="text"
                                        value={walletAddress}
                                        onChange={(event) => setWalletAddress(event.target.value)}
                                        placeholder="0x..."
                                    />
                                </div>

                                <button className="panel-submit" type="submit" disabled={granting}>
                                    <Share2 size={16} />
                                    {granting ? "Granting..." : "Grant Access"}
                                </button>
                            </form>

                            {grantError && <p className="panel-error">{grantError}</p>}
                            {grantMessage && <p className="panel-success">{grantMessage}</p>}
                        </article>
                    </section>
                )}

                {activeTab === "files" && (
                    <section className="dash-list-section">
                        <div className="dash-list-header">
                            <h2 className="dash-section-title">Your Files</h2>
                            <div className="dash-search-wrap">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by name, fileId, tx hash"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                />
                            </div>
                        </div>

                        {filesError && <p className="panel-error">{filesError}</p>}

                        <div className="dash-files-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>File Name</th>
                                        <th>Size</th>
                                        <th>Created</th>
                                        <th>File ID</th>
                                        <th>Tx Hash</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFiles.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="dash-empty-cell">
                                                {filesLoading ? "Loading files..." : "No files found"}
                                            </td>
                                        </tr>
                                    )}

                                    {filteredFiles.map((file) => (
                                        <tr key={file.fileId}>
                                            <td>{file.fileName}</td>
                                            <td>{formatBytes(file.size)}</td>
                                            <td>{formatDate(file.createdAt)}</td>
                                            <td className="mono-cell">{shortHash(file.fileId)}</td>
                                            <td className="mono-cell">{shortHash(file.blockchainTxHash)}</td>
                                            <td>
                                                <span className={`dash-status ${file.status || "pending"}`}>
                                                    <span className="dash-status-dot" />
                                                    {(file.status || "pending").toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
