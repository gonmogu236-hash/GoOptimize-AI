/**
 * スコア計算エンジン（シミュレーション版）
 * 
 * 着手パターンからアルゴリズミックに各種スコアを算出。
 * 将来的にKataGo APIに差し替え可能なインターフェースで設計。
 */

import { PHASES, classifyMoves } from './phaseClassifier.js';

/**
 * シミュレーション勝率推移を生成
 * 勝率（winRate）は「ユーザー視点」として常に50%からスタートし、上限100%・下限0%で推移するように生成します。
 */
export function generateWinRateCurve(moves, metadata, playerColor = 'B') {
    const totalMoves = moves.length;
    const winRates = [];
    let currentWinRate = 50.0; // ユーザー視点の初期勝率50%

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

        // ランダム変動
        const change = (rng() - 0.5) * volatility + positionFactor * 0.5;

        // 大悪手シミュレーション（確率5%で大きなドロップ）
        const blunderChance = rng();
        let blunderEffect = 0; // 手を打ったプレイヤーにとっての影響（マイナス）
        if (blunderChance < 0.05) {
            blunderEffect = -(rng() * 10 + 5); // -5% to -15%
        }

        // 手番による補正（手を打った側はコミなどの影響で微減しやすいと仮定）
        const turnFactor = -0.1;

        // このターンの「手を打った側にとっての勝率変動」
        const movingPlayerDelta = change + blunderEffect + turnFactor;

        // ユーザー視点での勝率変動に変換
        const isUserTurn = move.color === playerColor;
        const userDelta = isUserTurn ? movingPlayerDelta : -movingPlayerDelta; // 相手の悪手は自分の勝率UP

        currentWinRate += userDelta;

        // 範囲制限 (5% - 95%)
        currentWinRate = Math.max(5, Math.min(95, currentWinRate));

        // エラーの判定は「手を打った側」にとっての判定
        const isBlunder = blunderEffect < -8;
        const isMistake = blunderEffect < -4 && blunderEffect >= -8;

        // 悪手・疑問手の場合、シミュレーションによる正解手(correctMove)を生成
        let correctMove = null;
        if (isBlunder || isMistake) {
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

        // WinRates配列には「ユーザー視点の勝率（winRate）」と「手を打ったプレイヤー視点での変動（delta）」を記録する
        winRates.push({
            moveNumber: i + 1,
            winRate: Math.round(currentWinRate * 100) / 100, // ユーザーの勝率
            delta: Math.round(movingPlayerDelta * 100) / 100, // 手を打ったプレイヤーにとっての差分
            isBlunder,
            isMistake,
            correctMove,
            color: move.color // どちらの色が打ったか
        });
    }

    // 最終結果に向けて勝率を調整（ユーザー視点）
    const result = metadata.result || '';
    const userWon = (result.startsWith('B+') && playerColor === 'B') || (result.startsWith('W+') && playerColor === 'W');
    const opponentWon = (result.startsWith('W+') && playerColor === 'B') || (result.startsWith('B+') && playerColor === 'W');

    if (userWon) {
        // ユーザー勝ち → 最後は60%以上に
        const lastRate = winRates[winRates.length - 1];
        if (lastRate && lastRate.winRate < 55) {
            const adjustment = (60 - lastRate.winRate) / (totalMoves * 0.3);
            for (let i = Math.floor(totalMoves * 0.7); i < totalMoves; i++) {
                winRates[i].winRate = Math.min(95, winRates[i].winRate + adjustment * (i - Math.floor(totalMoves * 0.7)));
            }
        }
    } else if (opponentWon) {
        // 相手勝ち → 最後は40%以下に
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
 * ユーザーの手番のみを対象にスコアを計算します。
 */
export function calculateScores(moves, winRates, playerColor = 'B') {
    // 自分の着手と、自分が打った盤面の勝率の推移だけを抽出
    const userMoves = moves.filter(m => m.color === playerColor);
    const userWinRates = winRates.filter(wr => wr.color === playerColor);

    // 全着手手数を基準にするためのトータル（フェーズの比率計算用）
    const totalMoves = moves.length;

    const classified = classifyMoves(userMoves); // 自分の手だけを分類

    // 1. 布石力 - 序盤の自分の安定度
    const fusekiScore = calcFusekiScore(classified[PHASES.FUSEKI], userWinRates, totalMoves);

    // 2. 中盤戦闘力 - 中盤での自分の勝率維持・悪手の少なさ
    const chubanScore = calcChubanScore(classified[PHASES.CHUBAN], userWinRates, totalMoves);

    // 3. 死活精度 - 自分の大きなブランダーの少なさ
    const shikatsuScore = calcShikatsuScore(userWinRates);

    // 4. ヨセ精度 - 終盤での自分の安定度
    const yoseScore = calcYoseScore(classified[PHASES.YOSE], userWinRates, totalMoves);

    // 5. 安定性 - 自分の手による勝率の変動幅の小ささ
    const stabilityScore = calcStabilityScore(userWinRates);

    // 6. 判断力 - 自分の悪手の少なさ
    const judgmentScore = calcJudgmentScore(userWinRates);

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

function calcFusekiScore(fusekiMoves, userWinRates, totalMoves) {
    if (fusekiMoves.length === 0) return 70;
    const end = Math.floor(totalMoves / 3);
    const fusekiRates = userWinRates.filter(wr => wr.moveNumber <= end);
    // 自分にとってマイナスになった変動の平均を取る（悪手率）
    const negativeDeltas = fusekiRates.filter(wr => wr.delta < 0);
    const avgDrop = negativeDeltas.reduce((sum, wr) => sum + Math.abs(wr.delta), 0) / (fusekiRates.length || 1);
    return Math.max(20, Math.min(98, 92 - avgDrop * 8));
}

function calcChubanScore(chubanMoves, userWinRates, totalMoves) {
    if (chubanMoves.length === 0) return 70;
    const start = Math.floor(totalMoves / 3);
    const end = Math.floor(totalMoves * 2 / 3);
    const chubanRates = userWinRates.filter(wr => wr.moveNumber > start && wr.moveNumber <= end);
    const blunders = chubanRates.filter(wr => wr.isBlunder).length;
    const mistakes = chubanRates.filter(wr => wr.isMistake).length;
    const baseScore = 88;
    return Math.max(20, Math.min(98, baseScore - blunders * 15 - mistakes * 4));
}

function calcShikatsuScore(userWinRates) {
    const bigDrops = userWinRates.filter(wr => wr.delta < -8).length;
    const medDrops = userWinRates.filter(wr => wr.delta < -5 && wr.delta >= -8).length;
    return Math.max(20, Math.min(98, 92 - bigDrops * 20 - medDrops * 6));
}

function calcYoseScore(yoseMoves, userWinRates, totalMoves) {
    if (yoseMoves.length === 0) return 70;
    const start = Math.floor(totalMoves * 2 / 3);
    const yoseRates = userWinRates.filter(wr => wr.moveNumber > start);
    const negativeDeltas = yoseRates.filter(wr => wr.delta < 0);
    const avgDrop = negativeDeltas.reduce((sum, wr) => sum + Math.abs(wr.delta), 0) / (yoseRates.length || 1);
    return Math.max(20, Math.min(98, 94 - avgDrop * 12));
}

function calcStabilityScore(userWinRates) {
    if (userWinRates.length === 0) return 70;
    // 自分の手の変動（特にマイナス方向）のバラツキをみる
    const deltas = userWinRates.filter(wr => wr.delta < 0).map(wr => Math.abs(wr.delta));
    if (deltas.length === 0) return 98;
    const variance = deltas.reduce((sum, d) => sum + d * d, 0) / userWinRates.length;
    return Math.max(20, Math.min(98, 96 - Math.sqrt(variance) * 8));
}

function calcJudgmentScore(userWinRates) {
    const totalBlunders = userWinRates.filter(wr => wr.isBlunder).length;
    const totalMistakes = userWinRates.filter(wr => wr.isMistake).length;
    const total = userWinRates.length || 1;
    const errorRate = (totalBlunders * 2 + totalMistakes) / total;
    return Math.max(20, Math.min(98, 93 - errorRate * 200));
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
