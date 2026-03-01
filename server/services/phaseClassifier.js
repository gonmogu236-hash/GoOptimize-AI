/**
 * フェーズ分類ロジック
 * 手数に基づいて布石・中盤・ヨセを自動分類
 */

/**
 * フェーズの動的境界を取得
 */
export function getPhaseBoundaries(totalMoves) {
    if (!totalMoves || totalMoves < 30) {
        return { fusekiEnd: 40, chubanEnd: 150 };
    }
    return {
        fusekiEnd: Math.floor(totalMoves / 3),
        chubanEnd: Math.floor((totalMoves * 2) / 3)
    };
}

export const PHASES = {
    FUSEKI: 'fuseki',     // 布石
    CHUBAN: 'chuban',     // 中盤
    YOSE: 'yose'          // ヨセ
};

export const PHASE_LABELS = {
    [PHASES.FUSEKI]: '布石',
    [PHASES.CHUBAN]: '中盤',
    [PHASES.YOSE]: 'ヨセ'
};

/**
 * 手番号からフェーズを判定
 */
export function getPhase(moveNumber, totalMoves) {
    const { fusekiEnd, chubanEnd } = getPhaseBoundaries(totalMoves);
    if (moveNumber <= fusekiEnd) return PHASES.FUSEKI;
    if (moveNumber <= chubanEnd) return PHASES.CHUBAN;
    return PHASES.YOSE;
}

/**
 * 全着手をフェーズ別に分類
 */
export function classifyMoves(moves) {
    const classified = {
        [PHASES.FUSEKI]: [],
        [PHASES.CHUBAN]: [],
        [PHASES.YOSE]: []
    };

    const totalMoves = moves.length;

    for (const move of moves) {
        const phase = getPhase(move.number, totalMoves);
        classified[phase].push(move);
    }

    return classified;
}

/**
 * フェーズ別の統計情報を計算
 */
export function getPhaseStats(moves) {
    const classified = classifyMoves(moves);

    return Object.entries(classified).map(([phase, phaseMoves]) => ({
        phase,
        label: PHASE_LABELS[phase],
        moveCount: phaseMoves.length,
        startMove: phaseMoves.length > 0 ? phaseMoves[0].number : 0,
        endMove: phaseMoves.length > 0 ? phaseMoves[phaseMoves.length - 1].number : 0
    }));
}
