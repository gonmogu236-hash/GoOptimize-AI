export default function DiagnosticReport({ diagnostic, playStyle, weaknesses }) {
    return (
        <div className="animate-in">
            {/* ヘッドライン */}
            <div className="diagnostic-headline">
                {diagnostic.headline}
            </div>

            {/* プレイスタイルバッジ */}
            <div className="play-style-badge">
                {getStyleEmoji(playStyle.style)} {playStyle.label}
            </div>

            {/* 推定棋力 */}
            <div style={{ marginBottom: '24px' }}>
                <span className="rank-badge">
                    🏅 推定棋力: {diagnostic.estimatedRank}
                </span>
            </div>

            {/* 診断セクション */}
            {diagnostic.sections.map((section, i) => (
                <div key={i} className="diagnostic-section">
                    <h4>{getSectionIcon(section.title)} {section.title}</h4>
                    <p>{section.content}</p>
                </div>
            ))}

            {/* 弱点リスト */}
            {weaknesses.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
                        🎯 検出された弱点
                    </h3>
                    <ul className="weakness-list">
                        {weaknesses.map((w, i) => (
                            <li key={i} className={`weakness-item ${w.severity}`}>
                                <span className={`weakness-severity ${w.severity}`}>
                                    {getSeverityLabel(w.severity)}
                                </span>
                                <div className="weakness-info">
                                    <h4>{w.label} ({w.score}点)</h4>
                                    <p>{w.detail}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* プレイスタイル詳細 */}
            <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                <h4 style={{ marginBottom: '8px' }}>🧠 プレイスタイル分析</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7' }}>
                    {playStyle.detail}
                </p>
                <div style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <MetricBadge label="中央指向" value={`${playStyle.metrics.centerRatio}%`} />
                    <MetricBadge label="辺指向" value={`${playStyle.metrics.edgeRatio}%`} />
                    <MetricBadge label="優勢時ミス率" value={`${playStyle.metrics.leadingBlunderRate}%`} />
                    <MetricBadge label="劣勢時無理手率" value={`${playStyle.metrics.trailingAggressionRate}%`} />
                </div>
            </div>
        </div>
    );
}

function MetricBadge({ label, value }) {
    return (
        <div style={{
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            fontSize: '0.8rem',
            display: 'flex',
            gap: '6px',
            alignItems: 'center'
        }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
        </div>
    );
}

function getStyleEmoji(style) {
    const emojis = {
        aggressive: '⚔️',
        defensive: '🛡️',
        balanced: '⚖️',
        self_destruct: '💥',
        territory: '🏠',
        influence: '🌊'
    };
    return emojis[style] || '🎯';
}

function getSectionIcon(title) {
    if (title.includes('概要')) return '📋';
    if (title.includes('強み')) return '💪';
    if (title.includes('改善')) return '⚠️';
    if (title.includes('スタイル')) return '🧠';
    if (title.includes('総評')) return '📊';
    return '📌';
}

function getSeverityLabel(severity) {
    const labels = {
        critical: '致命的',
        high: '重要',
        medium: '注意',
        low: '軽微'
    };
    return labels[severity] || severity;
}
