export default function LearningPlan({ learningPlan, estimatedRank }) {
    const { weeklyPlan, monthlyPlan, recommendations, dailyRoutine, targetRank } = learningPlan;

    return (
        <div className="learning-plan animate-in">
            {/* 目標ヘッダー */}
            <div style={{
                textAlign: 'center',
                marginBottom: '40px',
                padding: '32px',
                background: 'var(--gradient-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)'
            }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                    学習目標
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <span className="rank-badge">{estimatedRank}</span>
                    <span style={{ fontSize: '1.5rem' }}>→</span>
                    <span className="rank-badge" style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderColor: 'rgba(16, 185, 129, 0.3)',
                        color: 'var(--accent-primary)'
                    }}>
                        🎯 {targetRank}
                    </span>
                </div>
            </div>

            {/* デイリールーティン */}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
                📅 推奨デイリールーティン
            </h3>
            <div className="daily-routine" style={{ marginBottom: '40px' }}>
                {dailyRoutine.map((item, i) => (
                    <div key={i} className="routine-item">
                        <span className="routine-time">{item.time}</span>
                        <span className="routine-activity">{item.activity}</span>
                    </div>
                ))}
            </div>

            {/* 週間プラン */}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
                📆 4週間トレーニングプラン
            </h3>
            {weeklyPlan.map((week) => (
                <div key={week.week} className="week-card">
                    <div className="week-header">
                        <span className="week-number">Week {week.week}</span>
                        <span className="week-theme">{week.theme}</span>
                    </div>
                    <ul className="week-tasks">
                        {week.tasks.map((task, i) => (
                            <li key={i}>{task}</li>
                        ))}
                    </ul>
                    <div className="week-meta">
                        <span>📝 問題数: {week.problemCount}問</span>
                        <span>🎮 対局数: {week.gameCount}局</span>
                        {week.reviewRequired && <span>📖 レビュー必須</span>}
                    </div>
                </div>
            ))}

            {/* 月間プラン */}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '40px', marginBottom: '16px' }}>
                📊 3ヶ月ロードマップ
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                {monthlyPlan.map((month) => (
                    <div key={month.month} style={{
                        background: 'var(--gradient-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '24px'
                    }}>
                        <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: 'var(--accent-cyan)',
                            marginBottom: '8px'
                        }}>
                            Month {month.month}
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>
                            {month.goal}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            {month.description}
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap'
                        }}>
                            {month.focus.map((f, i) => (
                                <span key={i} style={{
                                    fontSize: '0.75rem',
                                    padding: '3px 10px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '20px',
                                    color: 'var(--accent-primary)'
                                }}>{f}</span>
                            ))}
                        </div>
                        <p style={{
                            fontSize: '0.8rem',
                            marginTop: '10px',
                            color: 'var(--accent-amber)',
                            fontWeight: 600
                        }}>
                            目標改善: {month.targetImprovement}
                        </p>
                    </div>
                ))}
            </div>

            {/* 推奨学習リソース */}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
                📚 推奨学習リソース
            </h3>
            {recommendations.map((rec, i) => (
                <div key={i} className="recommendation-card">
                    <h4>📂 {rec.category}</h4>
                    {rec.items.map((item, j) => (
                        <div key={j} className="recommendation-item">
                            <span className="name">
                                {getTypeIcon(item.type)} {item.name}
                            </span>
                            <span className={`priority ${item.priority}`}>
                                {item.priority === 'high' ? '優先高' : '優先中'}
                            </span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

function getTypeIcon(type) {
    const icons = {
        study: '📖',
        book: '📕',
        practice: '✏️',
        review: '🔍',
        mindset: '🧘'
    };
    return icons[type] || '📌';
}
