export default function Landing({ onStart }) {
    return (
        <>
            {/* ヒーローセクション */}
            <section className="hero">
                <div className="hero-badge animate-in stagger-1">
                    ✨ AI搭載 棋譜解析エンジン
                </div>
                <h1 className="animate-in stagger-2">
                    あなたの囲碁を<br />
                    <span className="gradient-text">科学的に解析</span>する
                </h1>
                <p className="hero-subtitle animate-in stagger-3">
                    SGFファイルをアップロードするだけで、弱点の特定・フェーズ別スコアリング・
                    パーソナライズされた学習プランを自動生成。
                    <strong>もう「何を勉強すべきか」で迷わない。</strong>
                </p>
                <div className="hero-actions animate-in stagger-4">
                    <button className="btn btn-primary" onClick={onStart}>
                        🎯 無料で解析を始める
                    </button>
                    <a className="btn btn-secondary" href="#features">
                        📖 機能を見る
                    </a>
                </div>
            </section>

            {/* 機能紹介 */}
            <section className="features" id="features">
                <h2 className="features-title">なぜ GoOptimize AI？</h2>
                <p className="features-subtitle">
                    ただ勝率を見せるだけのAIとは一線を画す、本気の学習支援
                </p>

                <div className="features-grid">
                    <div className="feature-card animate-in stagger-1">
                        <div className="feature-icon green">📊</div>
                        <h3>6軸レーダー分析</h3>
                        <p>
                            布石力・中盤戦闘力・死活精度・ヨセ精度・安定性・判断力。
                            6つの軸で棋力を可視化し、伸ばすべきポイントが一目瞭然。
                        </p>
                    </div>

                    <div className="feature-card animate-in stagger-2">
                        <div className="feature-icon purple">🧠</div>
                        <h3>プレイスタイル診断</h3>
                        <p>
                            攻撃型？防御型？自滅型？
                            あなたのプレイ傾向を人格診断のように分析。
                            弱点だけでなく「なぜ負けるのか」の根本原因を特定。
                        </p>
                    </div>

                    <div className="feature-card animate-in stagger-3">
                        <div className="feature-icon blue">📈</div>
                        <h3>勝率推移グラフ</h3>
                        <p>
                            1手ごとの勝率変動を可視化。
                            大悪手・疑問手をハイライトし、
                            どこで形勢を崩したかを正確に把握できます。
                        </p>
                    </div>

                    <div className="feature-card animate-in stagger-4">
                        <div className="feature-icon amber">📋</div>
                        <h3>学習プラン自動生成</h3>
                        <p>
                            弱点分析結果に基づいて、1週間・1ヶ月の
                            パーソナライズされた学習プランを自動生成。
                            推奨問題数やテーマも提案。
                        </p>
                    </div>

                    <div className="feature-card animate-in stagger-5">
                        <div className="feature-icon rose">🎯</div>
                        <h3>弱点自動分類</h3>
                        <p>
                            布石理解不足？死活が致命的？ヨセ精度不足？
                            弱点をカテゴリ別に自動分類し、
                            優先的に取り組むべき課題を明確化。
                        </p>
                    </div>

                    <div className="feature-card animate-in stagger-6">
                        <div className="feature-icon cyan">⚡</div>
                        <h3>即座に解析</h3>
                        <p>
                            SGFファイルをドラッグ＆ドロップするだけ。
                            数秒で詳細な解析レポートが完成。
                            アカウント登録不要で今すぐ使えます。
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}
