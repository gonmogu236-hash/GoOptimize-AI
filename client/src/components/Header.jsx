export default function Header({ onLogoClick, onAnalyze, showAnalyzeBtn }) {
    return (
        <header className="header">
            <a className="header-logo" onClick={onLogoClick}>
                <span className="logo-icon">⚫</span>
                <span>Go<span className="logo-text-accent">Optimize</span> AI</span>
            </a>
            <nav className="header-nav">
                {showAnalyzeBtn && (
                    <button className="nav-btn primary" onClick={onAnalyze}>
                        棋譜を解析する
                    </button>
                )}
            </nav>
        </header>
    );
}
