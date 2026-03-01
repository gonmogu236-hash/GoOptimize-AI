import { useRef, useEffect } from 'react';

/**
 * Canvas-based レーダーチャート
 * Chart.js なしで軽量に描画
 */
export default function RadarChart({ scores }) {
    const canvasRef = useRef(null);

    const labels = ['布石力', '中盤戦闘力', '死活精度', 'ヨセ精度', '安定性', '判断力'];
    const keys = ['fuseki', 'chuban', 'shikatsu', 'yose', 'stability', 'judgment'];
    const values = keys.map(k => scores[k] || 0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = 360;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(dpr, dpr);

        const cx = size / 2;
        const cy = size / 2;
        const maxRadius = 120;
        const numAxes = 6;
        const angleStep = (Math.PI * 2) / numAxes;
        const startAngle = -Math.PI / 2;

        ctx.clearRect(0, 0, size, size);

        // グリッド描画 (5段階)
        for (let level = 1; level <= 5; level++) {
            const r = (maxRadius / 5) * level;
            ctx.beginPath();
            for (let i = 0; i <= numAxes; i++) {
                const angle = startAngle + angleStep * i;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 軸線
        for (let i = 0; i < numAxes; i++) {
            const angle = startAngle + angleStep * i;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + maxRadius * Math.cos(angle), cy + maxRadius * Math.sin(angle));
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // データポリゴン
        ctx.beginPath();
        for (let i = 0; i <= numAxes; i++) {
            const idx = i % numAxes;
            const angle = startAngle + angleStep * idx;
            const r = (values[idx] / 100) * maxRadius;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        // グラデーション塗りつぶし
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        gradient.addColorStop(1, 'rgba(34, 211, 238, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // データポイント
        for (let i = 0; i < numAxes; i++) {
            const angle = startAngle + angleStep * i;
            const r = (values[i] / 100) * maxRadius;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
            ctx.strokeStyle = '#0a0e1a';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // ラベル
        ctx.font = '12px "Noto Sans JP", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';

        for (let i = 0; i < numAxes; i++) {
            const angle = startAngle + angleStep * i;
            const labelR = maxRadius + 28;
            const x = cx + labelR * Math.cos(angle);
            const y = cy + labelR * Math.sin(angle);

            ctx.fillStyle = '#94a3b8';
            ctx.fillText(labels[i], x, y + 4);

            // スコア値
            ctx.fillStyle = '#f0f4f8';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.fillText(values[i].toString(), x, y + 18);
            ctx.font = '12px "Noto Sans JP", sans-serif';
        }

    }, [scores]);

    return (
        <div className="radar-container">
            <canvas ref={canvasRef} />
        </div>
    );
}
