import { Link } from "react-router-dom";
import { 
    Rocket, FileText, Unlock, ShieldAlert, EyeOff, ServerCrash,
    Puzzle, Link2, ShieldCheck, Globe, Key, FileCheck, Zap,
    Upload, Scissors, HardDrive, Lock, RefreshCcw, Handshake
} from "lucide-react";
import "./LandingPage.css";

function LandingPage() {
    return (
        <div className="landing-page">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="landing-logo">
                    <div className="logo-mark">VC</div>
                    <span className="logo-text">VC FileShare</span>
                </div>
                <div className="landing-nav-links">
                    <a href="#problem">Problem</a>
                    <a href="#solution">Solution</a>
                    <a href="#features">Features</a>
                    <a href="#how-it-works">How It Works</a>
                </div>
                <div className="landing-nav-actions">
                    <Link to="/login" className="btn-login">Sign In</Link>
                    <Link to="/signup" className="btn-get-started">Get Started</Link>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="hero-section">
                    <div className="hero-blobs">
                        <div className="hero-blob blob-1"></div>
                        <div className="hero-blob blob-2"></div>
                    </div>
                    <div className="hero-content">
                        <div className="hero-badge">Next-Generation Security</div>
                        <h1 className="hero-headline">
                            Secure File Sharing,<br/> <span>Reinvented</span> with Cryptography & Blockchain.
                        </h1>
                        <p className="hero-subheading">
                            Protect your data with next-generation security using Visual Cryptography and Decentralized Blockchain Technology — ensuring confidentiality, integrity, and trust like never before.
                        </p>
                        <div className="hero-ctas">
                            <Link to="/signup" className="btn-primary">
                                <Rocket size={18} /> Get Started
                            </Link>
                            <a href="#demo" className="btn-secondary">
                                <FileText size={18} /> View Demo
                            </a>
                        </div>
                    </div>
                </section>

                {/* Problem Section */}
                <section id="problem" className="problem-section">
                    <div className="section-header">
                        <div className="section-eyebrow">The Challenge</div>
                        <h2>The Problem with Traditional File Sharing</h2>
                        <p>Today’s systems fail to guarantee both security AND trust simultaneously.</p>
                    </div>
                    <div className="problem-cards">
                        <div className="problem-card">
                            <div className="card-icon"><Unlock size={32} /></div>
                            <h3>Vulnerable to Breaches</h3>
                            <p>Centralized systems are prime targets for hacks and data leaks.</p>
                        </div>
                        <div className="problem-card">
                            <div className="card-icon"><ShieldAlert size={32} /></div>
                            <h3>Tampering Risks</h3>
                            <p>Files can be altered without detection by malicious actors.</p>
                        </div>
                        <div className="problem-card">
                            <div className="card-icon"><EyeOff size={32} /></div>
                            <h3>Lack of Transparency</h3>
                            <p>No verifiable proof of who accessed or modified the files.</p>
                        </div>
                        <div className="problem-card">
                            <div className="card-icon"><ServerCrash size={32} /></div>
                            <h3>Single Point of Failure</h3>
                            <p>If the central server goes down, your data is unavailable or lost.</p>
                        </div>
                    </div>
                </section>

                {/* Solution Section */}
                <section id="solution" className="solution-section">
                    <div className="solution-container">
                        <div className="solution-content">
                            <div className="section-eyebrow">The Innovation</div>
                            <h2>Our Solution: <br/><span>Dual-Layer Security System</span></h2>
                            <p>We combine two powerful technologies to provide a hybrid approach ensuring Confidentiality + Integrity + Authenticity.</p>
                            
                            <div className="solution-list">
                                <div className="solution-item">
                                    <div className="solution-icon"><Puzzle size={28} /></div>
                                    <div className="solution-text">
                                        <h4>Visual Cryptography</h4>
                                        <p>Splits files into multiple meaningless shares. No single share reveals any information. Reconstruction is only possible with all required shares.</p>
                                    </div>
                                </div>
                                <div className="solution-item">
                                    <div className="solution-icon"><Link2 size={28} /></div>
                                    <div className="solution-text">
                                        <h4>Blockchain Technology</h4>
                                        <p>Stores file metadata in a tamper-proof ledger ensuring transparency & immutability. Smart contracts handle access control & verification.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="solution-visual">
                            <div className="visual-circle">
                                <div className="visual-core">VC</div>
                                <div className="visual-orbit-item item-1"><Lock size={20} /></div>
                                <div className="visual-orbit-item item-2"><Handshake size={20} /></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Key Features Section */}
                <section id="features" className="features-section">
                    <div className="section-header">
                        <div className="section-eyebrow">Capabilities</div>
                        <h2>Key Features</h2>
                        <p>Experience bulletproof security with our innovative platform.</p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon"><ShieldCheck size={28} /></div>
                            <h4>End-to-End Security</h4>
                            <p>Your files are never stored as a whole — only encrypted shares exist.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><Globe size={28} /></div>
                            <h4>Decentralized Storage</h4>
                            <p>Powered by IPFS, eliminating dependency on centralized servers.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><Key size={28} /></div>
                            <h4>Smart Access Control</h4>
                            <p>Blockchain-based smart contracts ensure only authorized access.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><FileCheck size={28} /></div>
                            <h4>Tamper-Proof Records</h4>
                            <p>Every action is logged immutably on the blockchain network.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon"><Zap size={28} /></div>
                            <h4>Easy File Reconstruction</h4>
                            <p>Combine verified shares to securely retrieve original data.</p>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section id="how-it-works" className="hiw-section">
                    <div className="section-header">
                        <div className="section-eyebrow">Process</div>
                        <h2>How It Works</h2>
                        <p>A seamless process from upload to secure retrieval.</p>
                    </div>
                    <div className="timeline">
                        <div className="timeline-item">
                            <div className="step-num"><Upload size={20} /></div>
                            <div className="step-content">
                                <h3>Upload File</h3>
                                <p>Select the sensitive document you want to secure.</p>
                            </div>
                        </div>
                        <div className="timeline-item">
                            <div className="step-num"><Scissors size={20} /></div>
                            <div className="step-content">
                                <h3>Split into Visual Shares</h3>
                                <p>The file is cryptographically divided into unintelligible shares.</p>
                            </div>
                        </div>
                        <div className="timeline-item">
                            <div className="step-num"><HardDrive size={20} /></div>
                            <div className="step-content">
                                <h3>Store Shares on IPFS</h3>
                                <p>Shares are distributed across a decentralized network.</p>
                            </div>
                        </div>
                        <div className="timeline-item">
                            <div className="step-num"><Lock size={20} /></div>
                            <div className="step-content">
                                <h3>Record Metadata on Blockchain</h3>
                                <p>Hashes and access rules are immutably written to the ledger.</p>
                            </div>
                        </div>
                        <div className="timeline-item">
                            <div className="step-num"><RefreshCcw size={20} /></div>
                            <div className="step-content">
                                <h3>Reconstruct File Securely</h3>
                                <p>Authorized users retrieve and combine shares to view the file.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tech Stack & Use Cases */}
                <section className="bottom-sections">
                    <div className="tech-stack-section">
                        <h2>Technology Stack</h2>
                        <p>Designed with a modular architecture</p>
                        <div className="tech-tags">
                            <span className="tech-tag">React (Vite + TS)</span>
                            <span className="tech-tag">Node.js / Python</span>
                            <span className="tech-tag">IPFS Storage</span>
                            <span className="tech-tag">Blockchain Networks</span>
                        </div>
                    </div>
                    <div className="use-cases-section">
                        <h2>Use Cases</h2>
                        <ul className="use-cases-list">
                            <li><ShieldCheck size={18} /> Academic File Sharing</li>
                            <li><ShieldCheck size={18} /> Corporate Confidential Documents</li>
                            <li><ShieldCheck size={18} /> Government Data Exchange</li>
                            <li><ShieldCheck size={18} /> Secure Medical Records</li>
                            <li><ShieldCheck size={18} /> Any Sensitive Digital Communication</li>
                        </ul>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="landing-logo">
                            <div className="logo-mark">VC</div>
                            <span className="logo-text" style={{color: '#1c1c1c', fontSize: '18px'}}>VC FileShare</span>
                        </div>
                        <p>Securing the world's data, one block at a time.</p>
                    </div>
                    <div className="footer-links">
                        <a href="#problem">Problem</a>
                        <a href="#solution">Solution</a>
                        <a href="#features">Features</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2026 VC FileShare. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
