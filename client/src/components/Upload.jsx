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

export default function Upload({ onAnalysisComplete }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState('');
    const fileInput = useRef(null);

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

    const handleAnalyze = async (file) => {
        setIsAnalyzing(true);
        setError(null);
        setCurrentStep(0);
        setFileName(file.name);

        const stopSteps = simulateSteps();

        try {
            const result = await analyzeSGF(file);
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
        if (file) handleAnalyze(file);
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
        if (file) handleAnalyze(file);
    };

    const handleUseSample = async () => {
        setIsAnalyzing(true);
        setError(null);
        setCurrentStep(0);
        setFileName('sample_game.sgf');

        const stopSteps = simulateSteps();

        try {
            // サンプルSGFを直接送信
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

            const result = await analyzeSGFText(sampleSGF);
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
