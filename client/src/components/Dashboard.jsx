import { useState, useEffect, useRef } from 'react';
import RadarChart from './RadarChart';
import WinRateChart from './WinRateChart';
import GoBoard from './GoBoard';
import DiagnosticReport from './DiagnosticReport';
import LearningPlan from './LearningPlan';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { createCheckoutSession } from '../utils/api';

export default function Dashboard({ data, onNewAnalysis }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [isPremium, setIsPremium] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const reportRef = useRef(null);

    useEffect(() => {
        // 決済完了判定 (MVP用)
        const params = new URLSearchParams(window.location.search);
        if (params.get('payment') === 'success') {
            setIsPremium(true);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleUnlockPremium = async () => {
        try {
            const data = await createCheckoutSession();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (e) {
            alert(e.message || "決済システムとの通信に失敗しました。");
        }
    };

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0a0e1a',
                logging: false,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`GoOptimize_Report_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error('PDF export failed:', error);
            alert('PDFの出力に失敗しました。');
        } finally {
            setIsExporting(false);
        }
    };

    const { metadata, scores, winRates, weaknesses, playStyle, diagnostic, learningPlan, phaseStats, playerColor } = data;

    const scoreItems = [
        { key: 'fuseki', label: '布石力', emoji: '🏯' },
        { key: 'chuban', label: '中盤戦闘力', emoji: '⚔️' },
        { key: 'shikatsu', label: '死活精度', emoji: '💀' },
        { key: 'yose', label: 'ヨセ精度', emoji: '🎯' },
        { key: 'stability', label: '安定性', emoji: '⚖️' },
        { key: 'judgment', label: '判断力', emoji: '🧠' }
    ];

    const blunders = winRates?.filter(wr => wr.isBlunder && wr.color === playerColor).length || 0;
    const mistakes = winRates?.filter(wr => wr.isMistake && wr.color === playerColor).length || 0;

    return (
        <div className="dashboard" ref={reportRef}>
            {/* ヘッダー */}
            <div className="dashboard-header animate-in">
                <div className="dashboard-title">
                    <h2>解析結果 {isPremium && <span style={{ color: '#fbbf24', fontSize: '1rem', marginLeft: '8px' }}>★プレミアム</span>}</h2>
                    <span className="subtitle">
                        {metadata?.playerBlack || '不明'} vs {metadata?.playerWhite || '不明'} — {metadata?.result || '結果不明'} | {metadata?.totalMoves || 0}手
                        <br />
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px', display: 'inline-block' }}>
                            👤 解析対象: あなた ({playerColor === 'W' ? '白番' : '黒番'})
                        </span>
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {isPremium ? (
                        <button
                            className="btn btn-primary"
                            onClick={handleDownloadPDF}
                            disabled={isExporting}
                            style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#111827' }}
                        >
                            {isExporting ? '⏳ 出力中...' : '📄 PDFレポートを出力'}
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={handleUnlockPremium} style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#111827' }}>
                            🔓 詳細レポートを生成 (¥300)
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={onNewAnalysis}>
                        🔄 新しい棋譜を解析
                    </button>
                </div>
            </div>

            {/* スコアカード */}
            <div className="score-cards animate-in">
                <div className="score-card" style={{ gridColumn: 'span 1', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <div className="score-label">総合スコア</div>
                    <div className="score-value" style={{ fontSize: '2.5rem' }}>{scores?.overall || 0}</div>
                    <div className="score-rank">{diagnostic?.estimatedRank || '—'}</div>
                </div>
                {scoreItems.map(item => (
                    <div key={item.key} className="score-card">
                        <div className="score-label">{item.emoji} {item.label}</div>
                        <div className="score-value">{scores?.[item.key] || 0}</div>
                        <div className="score-rank">{getScoreGrade(scores?.[item.key])}</div>
                    </div>
                ))}
            </div>

            {/* タブナビゲーション */}
            <div className="tab-nav animate-in">
                {[
                    { key: 'overview', label: '📊 概要' },
                    { key: 'diagnostic', label: '🧠 診断' },
                    { key: 'plan', label: '📋 学習プラン' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 概要タブ */}
            {activeTab === 'overview' && (
                <div className="animate-fade">
                    <div className="dashboard-grid">
                        {/* レーダーチャート */}
                        <div className="panel">
                            <div className="panel-title">📊 スキルレーダー</div>
                            {scores && <RadarChart scores={scores} />}
                        </div>

                        {/* 碁盤ビューア */}
                        <div className="panel">
                            <div className="panel-title">🎮 棋譜ビューア</div>
                            {data.metadata && (
                                <GoBoard
                                    moves={extractMoves(data)}
                                    winRates={winRates}
                                />
                            )}
                        </div>
                    </div>

                    {/* 勝率推移グラフ */}
                    <div className="panel animate-in" style={{ marginBottom: '24px' }}>
                        <div className="panel-title">
                            📈 勝率推移
                            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                大悪手: {blunders}回 / 疑問手: {mistakes}回
                            </span>
                        </div>
                        {winRates && <WinRateChart winRates={winRates} playerColor={playerColor} />}
                    </div>

                    {/* フェーズ別サマリー */}
                    {phaseStats && (
                        <div className="panel animate-in">
                            <div className="panel-title">📋 フェーズ別サマリー</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                {phaseStats.map((ps) => (
                                    <div key={ps.phase} style={{
                                        padding: '16px',
                                        background: 'rgba(0, 0, 0, 0.15)',
                                        borderRadius: 'var(--radius-sm)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                            {ps.label}
                                        </div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                                            {ps.moveCount}手
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {ps.startMove}〜{ps.endMove}手
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 診断タブ */}
            {activeTab === 'diagnostic' && diagnostic && (
                <div className="panel animate-fade" style={{ position: 'relative' }}>
                    {!isPremium && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(10, 14, 26, 0.8)', backdropFilter: 'blur(8px)',
                            zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)'
                        }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>🔒 プレミアム機能</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center', maxWidth: '400px' }}>
                                AIによる詳細な弱点分析、プレイスタイル診断、およびパーソナルコーチングはプレミアム版でのみご利用いただけます。
                            </p>
                            <button className="btn btn-primary" onClick={handleUnlockPremium} style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#111827', fontSize: '1.1rem', padding: '12px 32px' }}>
                                今すぐアンロックする (¥300)
                            </button>
                        </div>
                    )}
                    <DiagnosticReport
                        diagnostic={diagnostic}
                        playStyle={playStyle}
                        weaknesses={weaknesses}
                    />
                </div>
            )}

            {/* 学習プランタブ */}
            {activeTab === 'plan' && learningPlan && (
                <div className="animate-fade" style={{ position: 'relative' }}>
                    {!isPremium && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(10, 14, 26, 0.8)', backdropFilter: 'blur(8px)',
                            zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)'
                        }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>🔒 プレミアム機能</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', textAlign: 'center', maxWidth: '400px' }}>
                                あなたの弱点に最適化された1ヶ月の専用学習ロードマップと、推奨問題セットはプレミアム版で解放されます。
                            </p>
                            <button className="btn btn-primary" onClick={handleUnlockPremium} style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#111827', fontSize: '1.1rem', padding: '12px 32px' }}>
                                今すぐアンロックする (¥300)
                            </button>
                        </div>
                    )}
                    <LearningPlan
                        learningPlan={learningPlan}
                        estimatedRank={diagnostic?.estimatedRank || '—'}
                    />
                </div>
            )}
        </div>
    );
}

function getScoreGrade(score) {
    if (!score) return '—';
    if (score >= 90) return '秀';
    if (score >= 80) return '優';
    if (score >= 70) return '良';
    if (score >= 55) return '可';
    return '要改善';
}

/**
 * APIレスポンスから moves 配列を取得
 */
function extractMoves(data) {
    return data.moves || [];
}
