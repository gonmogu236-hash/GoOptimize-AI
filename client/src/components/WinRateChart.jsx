import { useRef, useEffect } from 'react';

/**
 * 勝率推移グラフ（Canvas描画）
 */
export default function WinRateChart({ winRates }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !winRates?.length) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.parentElement.clientWidth || 600;
        const height = 250;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        const padding = { top: 20, right: 20, bottom: 45, left: 45 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, width, height);

        // 背景グリッド
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.lineWidth = 1;
        for (let pct = 0; pct <= 100; pct += 25) {
            const y = padding.top + chartH * (1 - pct / 100);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartW, y);
            ctx.stroke();

            // Y軸ラベル
            ctx.fillStyle = '#64748b';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${pct}%`, padding.left - 8, y + 3);
        }

        // 50%ライン（赤点線）
        const y50 = padding.top + chartH * 0.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
        ctx.beginPath();
        ctx.moveTo(padding.left, y50);
        ctx.lineTo(padding.left + chartW, y50);
        ctx.stroke();
        ctx.setLineDash([]);

        // フェーズ境界線
        const totalMoves = winRates.length;
        const fusekiEnd = Math.floor(totalMoves / 3);
        const chubanEnd = Math.floor(totalMoves * 2 / 3);

        const drawPhaseLine = (moveNum, label) => {
            if (moveNum >= totalMoves) return;
            const x = padding.left + (moveNum / totalMoves) * chartW;
            ctx.setLineDash([2, 2]);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + chartH);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#64748b';
            ctx.font = '10px "Noto Sans JP", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(label, x, padding.top + chartH + 34);
        };

        drawPhaseLine(fusekiEnd, '布石→中盤');
        drawPhaseLine(chubanEnd, '中盤→ヨセ');

        // グラデーション塗りつぶし
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
        gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.05)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + chartH);
        winRates.forEach((wr, i) => {
            const x = padding.left + (i / totalMoves) * chartW;
            const y = padding.top + chartH * (1 - wr.winRate / 100);
            ctx.lineTo(x, y);
        });
        ctx.lineTo(padding.left + chartW, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // メインライン
        ctx.beginPath();
        winRates.forEach((wr, i) => {
            const x = padding.left + (i / totalMoves) * chartW;
            const y = padding.top + chartH * (1 - wr.winRate / 100);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 悪手マーカー
        winRates.forEach((wr, i) => {
            if (wr.isBlunder || wr.isMistake) {
                const x = padding.left + (i / totalMoves) * chartW;
                const y = padding.top + chartH * (1 - wr.winRate / 100);

                ctx.beginPath();
                ctx.arc(x, y, wr.isBlunder ? 5 : 3, 0, Math.PI * 2);
                ctx.fillStyle = wr.isBlunder ? '#f43f5e' : '#f59e0b';
                ctx.fill();
                ctx.strokeStyle = '#0a0e1a';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        });

        // X軸ラベル
        ctx.fillStyle = '#64748b';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        const step = Math.max(1, Math.floor(totalMoves / 6));
        for (let i = 0; i <= totalMoves; i += step) {
            const x = padding.left + (i / totalMoves) * chartW;
            ctx.fillText(i.toString(), x, padding.top + chartH + 20);
        }

        // 凡例
        const legendX = padding.left + 10;
        const legendY = padding.top + 10;

        ctx.beginPath();
        ctx.arc(legendX, legendY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#f43f5e';
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px "Noto Sans JP", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('大悪手', legendX + 10, legendY + 3);

        ctx.beginPath();
        ctx.arc(legendX + 70, legendY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('疑問手', legendX + 80, legendY + 3);

    }, [winRates]);

    return (
        <div className="win-rate-chart">
            <canvas ref={canvasRef} style={{ width: '100%' }} />
        </div>
    );
}
