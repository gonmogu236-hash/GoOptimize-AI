import { useState } from 'react';

export default function Landing({ onStart }) {
    const [modal, setModal] = useState(null);

    const closeModal = () => setModal(null);

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

            {/* フッター */}
            <footer className="footer">
                <div className="footer-links">
                    <button onClick={() => setModal('tokusho')}>特定商取引法に基づく表記</button>
                    <button onClick={() => setModal('privacy')}>プライバシーポリシー</button>
                </div>
                <p className="footer-copy">&copy; 2026 GoOptimize AI. All rights reserved.</p>
            </footer>

            {/* モーダル */}
            {modal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>&times;</button>

                        {modal === 'tokusho' && (
                            <div className="legal-doc">
                                <h2>特定商取引法に基づく表記</h2>
                                <table className="legal-table">
                                    <tbody>
                                        <tr><th>販売業者名</th><td>山先 直子（屋号：GoOptimize AI）</td></tr>
                                        <tr><th>代表責任者</th><td>山先 直子</td></tr>
                                        <tr><th>所在地</th><td>請求により遅滞なく提供します</td></tr>
                                        <tr><th>メールアドレス</th><td>gonmogu236@gmail.com</td></tr>
                                        <tr><th>電話番号</th><td>090-3124-0502</td></tr>
                                        <tr><th>販売価格</th><td>各商品ページ（解析ダッシュボード）に表示</td></tr>
                                        <tr><th>商品代金以外の必要料金</th><td>なし（インターネット接続費用は別途必要）</td></tr>
                                        <tr><th>支払方法</th><td>クレジットカード（Stripe決済）</td></tr>
                                        <tr><th>商品の引渡時期</th><td>決済完了後、即座に機能が解放されます</td></tr>
                                        <tr><th>返品・キャンセルについて</th><td>デジタルコンテンツの性質上、決済後の返金・キャンセルはお受けできません</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {modal === 'privacy' && (
                            <div className="legal-doc">
                                <h2>プライバシーポリシー</h2>
                                <p>GoOptimize AI（以下「当サービス」）は、お客様の個人情報を適切に保護することを重要な責務と考え、以下の通りプライバシーポリシーを定めます。</p>
                                <h3>1. 収集する情報</h3>
                                <p>当サービスでは、棋譜解析データの保存、および決済処理の過程で、メールアドレス、決済情報（Stripeが処理）、アップロードされたSGFデータを収集します。</p>
                                <h3>2. 利用目的</h3>
                                <p>収集した情報は、解析機能の提供、決済の完了、およびユーザーサポートの目的にのみ利用します。</p>
                                <h3>3. 第三者提供</h3>
                                <p>法令に基づく場合を除き、お客様の同意なく個人情報を第三者に提供することはありません。決済処理については、Stripe, Inc. に委託します。</p>
                                <h3>4. 安全管理</h3>
                                <p>収集した情報の漏えい、滅失の防止に努め、適切な安全管理措置を講じます。</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
