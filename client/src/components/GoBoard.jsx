import { useRef, useEffect, useState } from 'react';

/**
 * 碁盤ビューア（Canvas描画）
 */
export default function GoBoard({ moves, winRates }) {
    const canvasRef = useRef(null);
    const [currentMove, setCurrentMove] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const boardSize = 19;

    // 自動再生タイマー
    useEffect(() => {
        let timer;
        if (isPlaying) {
            timer = setInterval(() => {
                setCurrentMove(m => {
                    if (m >= moves.length) {
                        setIsPlaying(false);
                        return m;
                    }
                    return m + 1;
                });
            }, 500);
        }
        return () => clearInterval(timer);
    }, [isPlaying, moves.length]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = 380;
        const cellSize = size / (boardSize + 1);

        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(dpr, dpr);

        // 碁盤背景（明るいベージュ）
        ctx.fillStyle = '#e8d1a7';
        ctx.fillRect(0, 0, size, size);

        // グリッド線（黒半透明）
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 0.5;

        for (let i = 0; i < boardSize; i++) {
            const pos = cellSize + i * cellSize;
            // 縦線
            ctx.beginPath();
            ctx.moveTo(pos, cellSize);
            ctx.lineTo(pos, cellSize + (boardSize - 1) * cellSize);
            ctx.stroke();
            // 横線
            ctx.beginPath();
            ctx.moveTo(cellSize, pos);
            ctx.lineTo(cellSize + (boardSize - 1) * cellSize, pos);
            ctx.stroke();
        }

        // 星（ホシ）
        const hoshiPoints = [3, 9, 15];
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        for (const x of hoshiPoints) {
            for (const y of hoshiPoints) {
                ctx.beginPath();
                ctx.arc(cellSize + x * cellSize, cellSize + y * cellSize, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 着手描画
        const displayMoves = moves.slice(0, currentMove);

        displayMoves.forEach((move, idx) => {
            if (move.pass) return;

            const x = cellSize + move.x * cellSize;
            const y = cellSize + move.y * cellSize;
            const radius = cellSize * 0.42;

            // 石の影
            ctx.beginPath();
            ctx.arc(x + 1, y + 1, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();

            // 石
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);

            if (move.color === 'B') {
                const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, radius);
                grad.addColorStop(0, '#444');
                grad.addColorStop(1, '#111');
                ctx.fillStyle = grad;
            } else {
                const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, radius);
                grad.addColorStop(0, '#fff');
                grad.addColorStop(1, '#ddd');
                ctx.fillStyle = grad;
            }
            ctx.fill();

            // 最後の手をハイライト
            if (idx === displayMoves.length - 1) {
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // 悪手を赤いリングでマーク
            if (winRates && winRates[idx]) {
                if (winRates[idx].isBlunder) {
                    ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                } else if (winRates[idx].isMistake) {
                    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        });

        // 正解手（シミュレーション）の半透明表示
        // 現在の手で悪手・疑問手だった場合、その手の推奨手（ダミー）を表示する
        if (!isPlaying && currentMove > 0 && winRates && winRates[currentMove - 1]) {
            const wr = winRates[currentMove - 1];
            if ((wr.isBlunder || wr.isMistake) && wr.correctMove) {
                const cx = cellSize + wr.correctMove.x * cellSize;
                const cy = cellSize + wr.correctMove.y * cellSize;
                const radius = cellSize * 0.42;

                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fillStyle = wr.color === 'B' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)';
                ctx.fill();

                // 「正解」テキストを重ねる
                ctx.fillStyle = wr.color === 'B' ? '#ffffff' : '#000000';
                ctx.font = '10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('正解', cx, cy);
            }
        }

        // 手数表示
        ctx.fillStyle = '#334155';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${currentMove} / ${moves.length} 手`, 8, size - 8);

    }, [moves, winRates, currentMove]);

    const handlePrev = () => { setIsPlaying(false); setCurrentMove(m => Math.max(0, m - 1)); };
    const handleNext = () => { setIsPlaying(false); setCurrentMove(m => Math.min(moves.length, m + 1)); };
    const handleStart = () => { setIsPlaying(false); setCurrentMove(0); };
    const handleEnd = () => { setIsPlaying(false); setCurrentMove(moves.length); };
    const handlePrev10 = () => { setIsPlaying(false); setCurrentMove(m => Math.max(0, m - 10)); };
    const handleNext10 = () => { setIsPlaying(false); setCurrentMove(m => Math.min(moves.length, m + 10)); };
    const togglePlay = () => setIsPlaying(p => !p);

    return (
        <div className="go-board-container">
            <canvas ref={canvasRef} className="go-board-canvas" />
            <div className="board-controls">
                <button onClick={handleStart} title="最初へ">⏮</button>
                <button onClick={handlePrev10} title="10手戻る">⏪</button>
                <button onClick={handlePrev} title="1手戻る">◀</button>
                <button onClick={togglePlay} title={isPlaying ? "停止" : "自動再生"} style={{ background: isPlaying ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)' }}>
                    {isPlaying ? '⏸' : '⏯'}
                </button>
                <button onClick={handleNext} title="1手進む">▶</button>
                <button onClick={handleNext10} title="10手進む">⏩</button>
                <button onClick={handleEnd} title="最後へ">⏭</button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px', lineHeight: '1.4' }}>
                💡 「▶ 1手進む」ボタンで大悪手または疑問手の局面に進むと<br />
                AIが推奨する正解手（半透明の石）が表示されます。
            </p>
        </div>
    );
}
