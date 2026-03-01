/**
 * スコア計算エンジン（シミュレーション版）
 * 
 * 着手パターンからアルゴリズミックに各種スコアを算出。
 * 将来的にKataGo APIに差し替え可能なインターフェースで設計。
 */

import { PHASES, classifyMoves } from './phaseClassifier.js';

/**
 * シミュレーション勝率推移を生成
 * 着手の分布パターンから、リアルな勝率推移をアルゴリズミックに生成
 */
export function generateWinRateCurve(moves, metadata) {
    const totalMoves = moves.length;
    const winRates = [];
    let currentWinRate = 50.0; // 初期勝率50%

    // シード値（再現性のため）
    const seed = hashMoves(moves);
    let rng = createSeededRandom(seed);

    for (let i = 0; i < totalMoves; i++) {
        const move = moves[i];
        const phase = getPhaseForMove(i + 1, totalMoves);

        // フェーズに応じた変動幅を設定
        let volatility;
        switch (phase) {
            case PHASES.FUSEKI:
                volatility = 2.0; // 布石は安定
                break;
            case PHASES.CHUBAN:
                volatility = 5.0; // 中盤は激しい
                break;
            case PHASES.YOSE:
                volatility = 1.5; // ヨセは小さな変動
                break;
        }

        // 着手座標から変動を計算（中央寄り = 積極的、辺寄り = 慎重）
        let positionFactor = 0;
        if (!move.pass) {
            const centerDist = Math.sqrt(
                Math.pow(move.x - 9, 2) + Math.pow(move.y - 9, 2)
            );
            positionFactor = (9 - centerDist) / 9; // -1 to 1
        }

        // ランダム変動 + 位置ファクター
        const change = (rng() - 0.5) * volatility + positionFactor * 0.5;

        // 大悪手シミュレーション（確率5%で大きなドロップ）
        const blunderChance = rng();
        let blunderEffect = 0;
        if (blunderChance < 0.05) {
            blunderEffect = -(rng() * 10 + 5); // -5% to -15%
        }

        // 手番による補正（黒なら+、白なら-方向に調整）
        const turnFactor = move.color === 'B' ? 0.3 : -0.3;

        currentWinRate += change + blunderEffect + turnFactor;

        // 範囲制限 (5% - 95%)
        currentWinRate = Math.max(5, Math.min(95, currentWinRate));

        const isBlunder = blunderEffect < -8;
        const isMistake = blunderEffect < -4 && blunderEffect >= -8;

        // 悪手・疑問手の場合、シミュレーションによる正解手(correctMove)を生成
        let correctMove = null;
        if (isBlunder || isMistake) {
            // 次の着手が存在すればその近く、存在しなければ盤面中央のランダムを推奨手とする
            let nextValidMove = null;
            for (let j = i + 1; j < totalMoves && j < i + 10; j++) {
                if (!moves[j].pass) { nextValidMove = moves[j]; break; }
            }
            if (nextValidMove) {
                correctMove = {
                    x: Math.max(0, Math.min(18, nextValidMove.x + (rng() > 0.5 ? 1 : -1))),
                    y: Math.max(0, Math.min(18, nextValidMove.y + (rng() > 0.5 ? 1 : -1)))
                };
            } else {
                correctMove = { x: 9 + Math.floor(rng() * 5 - 2), y: 9 + Math.floor(rng() * 5 - 2) };
            }
        }

        winRates.push({
            moveNumber: i + 1,
            winRate: Math.round(currentWinRate * 100) / 100,
            delta: Math.round((change + blunderEffect) * 100) / 100,
            isBlunder,
            isMistake,
            correctMove,
            color: move.color
        });
    }

    // 最終結果に向けて勝率を調整
    const result = metadata.result || '';
    if (result.startsWith('B+')) {
        // 黒勝ち → 最後は60%以上に
        const lastRate = winRates[winRates.length - 1];
        if (lastRate && lastRate.winRate < 55) {
            const adjustment = (60 - lastRate.winRate) / (totalMoves * 0.3);
            for (let i = Math.floor(totalMoves * 0.7); i < totalMoves; i++) {
                winRates[i].winRate = Math.min(95, winRates[i].winRate + adjustment * (i - Math.floor(totalMoves * 0.7)));
            }
        }
    } else if (result.startsWith('W+')) {
        // 白勝ち → 最後は40%以下に
        const lastRate = winRates[winRates.length - 1];
        if (lastRate && lastRate.winRate > 45) {
            const adjustment = (lastRate.winRate - 40) / (totalMoves * 0.3);
            for (let i = Math.floor(totalMoves * 0.7); i < totalMoves; i++) {
                winRates[i].winRate = Math.max(5, winRates[i].winRate - adjustment * (i - Math.floor(totalMoves * 0.7)));
            }
        }
    }

    return winRates;
}

/**
 * 6項目のスコアを計算（100点満点）
 */
export function calculateScores(moves, winRates) {
    const classified = classifyMoves(moves);

    // 1. 布石力 - 序盤の安定度
    const fusekiScore = calcFusekiScore(classified[PHASES.FUSEKI], winRates, moves.length);

    // 2. 中盤戦闘力 - 中盤での勝率維持・向上
    const chubanScore = calcChubanScore(classified[PHASES.CHUBAN], winRates, moves.length);

    // 3. 死活精度 - 大きなブランダーの少なさ
    const shikatsuScore = calcShikatsuScore(winRates);

    // 4. ヨセ精度 - 終盤での安定度
    const yoseScore = calcYoseScore(classified[PHASES.YOSE], winRates, moves.length);

    // 5. 安定性 - 勝率の変動幅の小ささ
    const stabilityScore = calcStabilityScore(winRates);

    // 6. 判断力 - 好手の多さ / 悪手の少なさ
    const judgmentScore = calcJudgmentScore(winRates);

    return {
        fuseki: Math.round(fusekiScore),
        chuban: Math.round(chubanScore),
        shikatsu: Math.round(shikatsuScore),
        yose: Math.round(yoseScore),
        stability: Math.round(stabilityScore),
        judgment: Math.round(judgmentScore),
        overall: Math.round(
            (fusekiScore + chubanScore + shikatsuScore + yoseScore + stabilityScore + judgmentScore) / 6
        )
    };
}

function calcFusekiScore(fusekiMoves, winRates, totalMoves) {
    if (fusekiMoves.length === 0) return 70;
    const end = Math.floor(totalMoves / 3);
    const fusekiRates = winRates.filter(wr => wr.moveNumber <= end);
    const avgDelta = fusekiRates.reduce((sum, wr) => sum + Math.abs(wr.delta), 0) / (fusekiRates.length || 1);
    // 小さい変動 = 高スコア
    return Math.max(20, Math.min(98, 90 - avgDelta * 8));
}

function calcChubanScore(chubanMoves, winRates, totalMoves) {
    if (chubanMoves.length === 0) return 70;
    const start = Math.floor(totalMoves / 3);
    const end = Math.floor(totalMoves * 2 / 3);
    const chubanRates = winRates.filter(wr => wr.moveNumber > start && wr.moveNumber <= end);
    const blunders = chubanRates.filter(wr => wr.isBlunder).length;
    const mistakes = chubanRates.filter(wr => wr.isMistake).length;
    const baseScore = 85;
    return Math.max(20, Math.min(98, baseScore - blunders * 15 - mistakes * 5));
}

function calcShikatsuScore(winRates) {
    const bigDrops = winRates.filter(wr => wr.delta < -8).length;
    const medDrops = winRates.filter(wr => wr.delta < -5 && wr.delta >= -8).length;
    return Math.max(20, Math.min(98, 90 - bigDrops * 20 - medDrops * 5));
}

function calcYoseScore(yoseMoves, winRates, totalMoves) {
    if (yoseMoves.length === 0) return 70;
    const start = Math.floor(totalMoves * 2 / 3);
    const yoseRates = winRates.filter(wr => wr.moveNumber > start);
    const avgDelta = yoseRates.reduce((sum, wr) => sum + Math.abs(wr.delta), 0) / (yoseRates.length || 1);
    return Math.max(20, Math.min(98, 92 - avgDelta * 12));
}

function calcStabilityScore(winRates) {
    if (winRates.length === 0) return 70;
    const deltas = winRates.map(wr => Math.abs(wr.delta));
    const variance = deltas.reduce((sum, d) => sum + d * d, 0) / deltas.length;
    return Math.max(20, Math.min(98, 95 - Math.sqrt(variance) * 10));
}

function calcJudgmentScore(winRates) {
    const totalBlunders = winRates.filter(wr => wr.isBlunder).length;
    const totalMistakes = winRates.filter(wr => wr.isMistake).length;
    const total = winRates.length || 1;
    const errorRate = (totalBlunders * 2 + totalMistakes) / total;
    return Math.max(20, Math.min(98, 90 - errorRate * 200));
}

// ヘルパー関数
function getPhaseForMove(moveNumber, totalMoves) {
    if (!totalMoves || totalMoves < 30) {
        if (moveNumber <= 40) return PHASES.FUSEKI;
        if (moveNumber <= 150) return PHASES.CHUBAN;
        return PHASES.YOSE;
    }
    const fusekiEnd = Math.floor(totalMoves / 3);
    const chubanEnd = Math.floor((totalMoves * 2) / 3);
    if (moveNumber <= fusekiEnd) return PHASES.FUSEKI;
    if (moveNumber <= chubanEnd) return PHASES.CHUBAN;
    return PHASES.YOSE;
}

function hashMoves(moves) {
    let hash = 0;
    for (const move of moves) {
        hash = ((hash << 5) - hash + move.x * 19 + move.y) | 0;
    }
    return Math.abs(hash);
}

function createSeededRandom(seed) {
    let s = seed || 1;
    return function () {
        s = (s * 16807 + 0) % 2147483647;
        return s / 2147483647;
    };
}
