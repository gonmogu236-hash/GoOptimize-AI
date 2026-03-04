import { useState, useRef, useCallback } from 'react';
import { analyzeSGF, analyzeSGFText } from '../utils/api';

const ANALYSIS_STEPS = [
    'SGFファイルを読み込み中...',
    '棋譜をパース中...',
    'フェーズを分類中...',
    '勝率を解析中...',
    'スコアを計算中...',
    '弱点を分析中...',
    '診断レポートを生成中...',
    '学習プランを作成中...'
];

/**
 * SGFテキストからPB/PW名を簡易パース
 */
function extractPlayerNames(sgfText) {
    const pbMatch = sgfText.match(/PB\[([^\]]*)\]/);
    const pwMatch = sgfText.match(/PW\[([^\]]*)\]/);
    return {
        black: pbMatch ? pbMatch[1] : '黒番プレイヤー',
        white: pwMatch ? pwMatch[1] : '白番プレイヤー'
    };
}

export default function Upload({ onAnalysisComplete }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState('');
    const fileInput = useRef(null);

    // 色選択ステート
    const [pendingFile, setPendingFile] = useState(null);
    const [pendingSGFText, setPendingSGFText] = useState(null);
    const [playerNames, setPlayerNames] = useState(null);
    const [showColorSelect, setShowColorSelect] = useState(false);

    const simulateSteps = useCallback(() => {
        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step >= ANALYSIS_STEPS.length) {
                clearInterval(interval);
                return;
            }
            setCurrentStep(step);
        }, 400);
        return () => clearInterval(interval);
    }, []);

    /**
     * SGFファイルを読み込み → 色選択画面を表示
     */
    const handleFileLoaded = (file) => {
        setError(null);
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const names = extractPlayerNames(text);
            setPlayerNames(names);
            setPendingFile(file);
            setPendingSGFText(null);
            setShowColorSelect(true);
        };
        reader.readAsText(file);
    };

    /**
     * 色を選択して解析を実行
     */
    const handleColorSelected = async (playerColor) => {
        setShowColorSelect(false);
        setIsAnalyzing(true);
        setCurrentStep(0);

        const stopSteps = simulateSteps();

        try {
            let result;
            if (pendingFile) {
                result = await analyzeSGF(pendingFile, playerColor);
            } else if (pendingSGFText) {
                result = await analyzeSGFText(pendingSGFText, playerColor);
            }
            stopSteps();
            setCurrentStep(ANALYSIS_STEPS.length);

            setTimeout(() => {
                onAnalysisComplete(result);
            }, 500);
        } catch (err) {
            stopSteps();
            setError(err.message);
            setIsAnalyzing(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileLoaded(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) handleFileLoaded(file);
    };

    const handleUseSample = () => {
        setError(null);
        setFileName('sample_game.sgf');

        const sampleSGF = `(;GM[1]FF[4]CA[UTF-8]SZ[19]KM[6.5]PB[あなた]PW[対戦相手]RE[B+2.5]DT[2024-01-15]
;B[pd];W[dp];B[pp];W[dd];B[fq];W[cn];B[jp];W[qn];B[ql];W[qq]
;B[pq];W[rp];B[ro];W[rq];B[qo];W[pr];B[or];W[ps];B[os];W[qr]
;B[nq];W[fc];B[cf];W[ch];B[cc];W[dc];B[cd];W[de];B[bf];W[dh]
;B[jd];W[qf];B[qe];W[pf];B[nd];W[qi];B[ok];W[oj];B[nk];W[nj]
;B[mk];W[mj];B[lk];W[kj];B[lj];W[li];B[ki];W[kk];B[kl];W[jk]
;B[jl];W[ik];B[il];W[hk];B[hl];W[gk];B[gl];W[fk];B[fl];W[el]
;B[fm];W[em];B[fn];W[eo];B[fo];W[fp];B[gp];W[ep];B[gq];W[er]
;B[fr];W[es];B[db];W[eb];B[da];W[ea];B[cb];W[ge];B[id];W[hc]
;B[ic];W[hb];B[ib];W[ha];B[ia];W[ga];B[rf];W[rg];B[re];W[sg]
;B[sf];W[qg];B[rn];W[rm];B[sm];W[rl];B[rk];W[sl];B[sk];W[sn]
;B[so];W[sm];B[qm];W[pm];B[pl];W[om];B[ol];W[nm];B[nl];W[mm]
;B[ml];W[lm];B[km];W[ln];B[kn];W[lo];B[ko];W[lp];B[lq];W[mp]
;B[mq];W[np];B[op];W[no];B[oo];W[nn];B[on];W[pn];B[po];W[oq]
;B[nr];W[kp];B[jq];W[kg];B[jg];W[kf];B[jf];W[ke];B[kd];W[le]
;B[ld];W[me];B[md];W[ne];B[od];W[oe];B[pe];W[of];B[ig];W[ih]
;B[jh];W[ji];B[kh];W[lh];B[hh];W[hi];B[gh];W[gi];B[fi];W[fj]
;B[ei];W[ej];B[di];W[ci];B[dj];W[dk];B[cj];W[bj];B[ck];W[cl]
;B[bk];W[bl];B[ak];W[al];B[aj];W[bi];B[ai];W[ah];B[ag];W[bh]
;B[bg];W[fe];B[ec];W[fb];B[ed];W[ee];B[fd];W[gd];B[gc];W[hd]
;B[he];W[ie];B[je];W[if];B[hf];W[hg];B[gg];W[gf];B[fg];W[ff]
;B[eg];W[dg];B[df];W[ef];B[cg])`;

        const names = extractPlayerNames(sampleSGF);
        setPlayerNames(names);
        setPendingFile(null);
        setPendingSGFText(sampleSGF);
        setShowColorSelect(true);
    };

    // === 色選択画面 ===
    if (showColorSelect && playerNames) {
        return (
            <div className="upload-section" style={{ paddingTop: '120px' }}>
                <div className="color-select-panel" style={{
                    maxWidth: '560px',
                    margin: '0 auto',
                    textAlign: 'center'
                }}>
                    <h2 style={{
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        marginBottom: '12px'
                    }}>
                        あなたはどちらで打ちましたか？
                    </h2>
                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        marginBottom: '32px'
                    }}>
                        選択した側の着手のみを解析対象とします。<br />
                        正確な診断のために、正しい色を選んでください。
                    </p>

                    <div style={{
                        display: 'flex', gap: '20px',
                        justifyContent: 'center', flexWrap: 'wrap'
                    }}>
                        {/* 黒番ボタン */}
                        <button
                            onClick={() => handleColorSelected('B')}
                            style={{
                                padding: '28px 36px',
                                background: 'linear-gradient(145deg, #1a2332, #1f2b3d)',
                                border: '2px solid rgba(148, 163, 184, 0.15)',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                minWidth: '220px',
                                textAlign: 'center',
                                color: '#fff',
                                fontFamily: 'inherit'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#10b981';
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{
                                width: '56px', height: '56px',
                                borderRadius: '50%',
                                background: '#1a1a2e',
                                border: '3px solid #555',
                                margin: '0 auto 16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '24px'
                            }}>
                                ⚫
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                黒番
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                marginTop: '4px'
                            }}>
                                {playerNames.black}
                            </div>
                        </button>

                        {/* 白番ボタン */}
                        <button
                            onClick={() => handleColorSelected('W')}
                            style={{
                                padding: '28px 36px',
                                background: 'linear-gradient(145deg, #1a2332, #1f2b3d)',
                                border: '2px solid rgba(148, 163, 184, 0.15)',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                minWidth: '220px',
                                textAlign: 'center',
                                color: '#fff',
                                fontFamily: 'inherit'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#10b981';
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.15)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{
                                width: '56px', height: '56px',
                                borderRadius: '50%',
                                background: '#e8e8e8',
                                border: '3px solid #ccc',
                                margin: '0 auto 16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '24px'
                            }}>
                                ⚪
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                白番
                            </div>
                            <div style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                marginTop: '4px'
                            }}>
                                {playerNames.white}
                            </div>
                        </button>
                    </div>

                    <p style={{
                        marginTop: '24px',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)'
                    }}>
                        📁 {fileName}
                    </p>

                    <button
                        onClick={() => {
                            setShowColorSelect(false);
                            setPendingFile(null);
                            setPendingSGFText(null);
                        }}
                        style={{
                            marginTop: '16px',
                            padding: '8px 20px',
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: '20px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '0.85rem'
                        }}
                    >
                        ← 戻る
                    </button>
                </div>
            </div>
        );
    }

    // === 解析中画面 ===
    if (isAnalyzing) {
        return (
            <div className="upload-section" style={{ paddingTop: '120px' }}>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <div className="loading-text">
                        {fileName} を解析中...
                    </div>
                    <div className="loading-steps">
                        {ANALYSIS_STEPS.map((step, i) => (
                            <div
                                key={i}
                                className={`loading-step ${i === currentStep ? 'active' :
                                    i < currentStep ? 'done' : ''
                                    }`}
                            >
                                {i < currentStep ? '✅' : i === currentStep ? '⏳' : '⬜'} {step}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // === アップロード画面 ===
    return (
        <div className="upload-section" style={{ paddingTop: '120px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
                棋譜をアップロード
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                SGFファイルを選択またはドラッグ＆ドロップしてください
            </p>

            <div
                className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInput.current?.click()}
            >
                <div className="upload-icon">📁</div>
                <h3>SGFファイルをドロップ</h3>
                <p>またはクリックしてファイルを選択</p>
                <p className="file-types">対応形式: .sgf（Smart Game Format）</p>
                <input
                    ref={fileInput}
                    type="file"
                    accept=".sgf"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </div>

            {error && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: '8px',
                    color: 'var(--accent-rose)',
                    fontSize: '0.9rem'
                }}>
                    ❌ {error}
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                    SGFファイルがない場合：
                </p>
                <button
                    className="btn btn-secondary"
                    onClick={handleUseSample}
                    style={{ fontSize: '0.9rem' }}
                >
                    🎮 サンプル棋譜で試す
                </button>
            </div>
        </div>
    );
}
