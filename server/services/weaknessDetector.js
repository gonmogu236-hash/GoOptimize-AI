/**
 * 弱点検出エンジン
 * スコアと勝率推移から弱点を自動分類・心理傾向を分析
 */

import { PHASES } from './phaseClassifier.js';

// 弱点カテゴリ
export const WEAKNESS_TYPES = {
    FUSEKI_WEAK: 'fuseki_weak',           // 布石理解不足
    SHIKATSU_WEAK: 'shikatsu_weak',       // 死活が致命的
    YOSE_WEAK: 'yose_weak',              // ヨセ精度不足
    STABILITY_WEAK: 'stability_weak',     // 安定性不足
    JUDGMENT_WEAK: 'judgment_weak',       // 判断力不足
    CHUBAN_WEAK: 'chuban_weak'           // 中盤力不足
};

export const WEAKNESS_LABELS = {
    [WEAKNESS_TYPES.FUSEKI_WEAK]: '布石理解不足',
    [WEAKNESS_TYPES.SHIKATSU_WEAK]: '死活精度が課題',
    [WEAKNESS_TYPES.YOSE_WEAK]: 'ヨセ精度不足',
    [WEAKNESS_TYPES.STABILITY_WEAK]: '安定性に欠ける',
    [WEAKNESS_TYPES.JUDGMENT_WEAK]: '判断ミスが多い',
    [WEAKNESS_TYPES.CHUBAN_WEAK]: '中盤戦闘力不足'
};

// プレイスタイル
export const PLAY_STYLES = {
    AGGRESSIVE: 'aggressive',     // 攻撃型
    DEFENSIVE: 'defensive',       // 防御型
    BALANCED: 'balanced',         // バランス型
    SELF_DESTRUCT: 'self_destruct', // 自滅型
    TERRITORY: 'territory',       // 地合い重視
    INFLUENCE: 'influence'        // 厚み重視
};

export const STYLE_LABELS = {
    [PLAY_STYLES.AGGRESSIVE]: '攻撃型',
    [PLAY_STYLES.DEFENSIVE]: '防御型',
    [PLAY_STYLES.BALANCED]: 'バランス型',
    [PLAY_STYLES.SELF_DESTRUCT]: '自滅型',
    [PLAY_STYLES.TERRITORY]: '地合い重視型',
    [PLAY_STYLES.INFLUENCE]: '厚み重視型'
};

/**
 * 弱点を検出
 */
export function detectWeaknesses(scores, winRates) {
    const weaknesses = [];
    const threshold = 65; // 65点以下を弱点とする

    if (scores.fuseki < threshold) {
        weaknesses.push({
            type: WEAKNESS_TYPES.FUSEKI_WEAK,
            label: WEAKNESS_LABELS[WEAKNESS_TYPES.FUSEKI_WEAK],
            score: scores.fuseki,
            severity: getSeverity(scores.fuseki),
            detail: generateFusekiDetail(scores.fuseki, winRates)
        });
    }

    if (scores.shikatsu < threshold) {
        weaknesses.push({
            type: WEAKNESS_TYPES.SHIKATSU_WEAK,
            label: WEAKNESS_LABELS[WEAKNESS_TYPES.SHIKATSU_WEAK],
            score: scores.shikatsu,
            severity: getSeverity(scores.shikatsu),
            detail: generateShikatsuDetail(scores.shikatsu, winRates)
        });
    }

    if (scores.yose < threshold) {
        weaknesses.push({
            type: WEAKNESS_TYPES.YOSE_WEAK,
            label: WEAKNESS_LABELS[WEAKNESS_TYPES.YOSE_WEAK],
            score: scores.yose,
            severity: getSeverity(scores.yose),
            detail: generateYoseDetail(scores.yose, winRates)
        });
    }

    if (scores.chuban < threshold) {
        weaknesses.push({
            type: WEAKNESS_TYPES.CHUBAN_WEAK,
            label: WEAKNESS_LABELS[WEAKNESS_TYPES.CHUBAN_WEAK],
            score: scores.chuban,
            severity: getSeverity(scores.chuban),
            detail: '中盤の戦いで勝率を大きく落とす場面が見られます。読みの深さと形勢判断の改善が必要です。'
        });
    }

    if (scores.stability < threshold) {
        weaknesses.push({
            type: WEAKNESS_TYPES.STABILITY_WEAK,
            label: WEAKNESS_LABELS[WEAKNESS_TYPES.STABILITY_WEAK],
            score: scores.stability,
            severity: getSeverity(scores.stability),
            detail: '勝率の上下動が激しく、安定したパフォーマンスが発揮できていません。'
        });
    }

    if (scores.judgment < threshold) {
        weaknesses.push({
            type: WEAKNESS_TYPES.JUDGMENT_WEAK,
            label: WEAKNESS_LABELS[WEAKNESS_TYPES.JUDGMENT_WEAK],
            score: scores.judgment,
            severity: getSeverity(scores.judgment),
            detail: '悪手・疑問手の割合が高く、局面判断力の向上が課題です。'
        });
    }

    // 弱点がない場合でも最低スコア項目を指摘
    if (weaknesses.length === 0) {
        const sortedScores = Object.entries(scores)
            .filter(([k]) => k !== 'overall')
            .sort((a, b) => a[1] - b[1]);

        const lowest = sortedScores[0];
        weaknesses.push({
            type: `${lowest[0]}_improvement`,
            label: `${getScoreLabel(lowest[0])}がさらに伸びしろあり`,
            score: lowest[1],
            severity: 'low',
            detail: `全体的に高水準ですが、${getScoreLabel(lowest[0])}にさらなる伸びしろがあります。`
        });
    }

    return weaknesses;
}

/**
 * プレイスタイルを判定
 */
export function analyzePlayStyle(moves, scores, winRates) {
    // 中央寄りの手の多さ → 攻撃性
    const centerMoves = moves.filter(m => {
        if (m.pass) return false;
        const dist = Math.sqrt(Math.pow(m.x - 9, 2) + Math.pow(m.y - 9, 2));
        return dist <= 5;
    }).length;

    const edgeMoves = moves.filter(m => {
        if (m.pass) return false;
        return m.x <= 3 || m.x >= 15 || m.y <= 3 || m.y >= 15;
    }).length;

    const total = moves.length || 1;
    const centerRatio = centerMoves / total;
    const edgeRatio = edgeMoves / total;

    // 優勢時のミス率
    const leadingMoves = winRates.filter(wr => wr.winRate > 55);
    const leadingBlunders = leadingMoves.filter(wr => wr.delta < -5).length;
    const leadingBlunderRate = leadingMoves.length > 0
        ? leadingBlunders / leadingMoves.length : 0;

    // 劣勢時の無理手率
    const trailingMoves = winRates.filter(wr => wr.winRate < 45);
    const trailingBigSwings = trailingMoves.filter(wr => Math.abs(wr.delta) > 5).length;
    const trailingAggressionRate = trailingMoves.length > 0
        ? trailingBigSwings / trailingMoves.length : 0;

    // スタイル判定
    let style;
    let styleDetail;

    if (leadingBlunderRate > 0.15) {
        style = PLAY_STYLES.SELF_DESTRUCT;
        styleDetail = '優勢を築いた後にミスを犯す傾向が強く、自ら勝ちを手放してしまいます。';
    } else if (centerRatio > 0.35 && trailingAggressionRate > 0.2) {
        style = PLAY_STYLES.AGGRESSIVE;
        styleDetail = '積極的に中央に進出し、戦いを好むスタイルです。劣勢時に無理手を打つ傾向があります。';
    } else if (edgeRatio > 0.5) {
        style = PLAY_STYLES.TERRITORY;
        styleDetail = '辺や隅での実利を重視するスタイルです。堅実ですが、中央での戦いに弱点があるかもしれません。';
    } else if (centerRatio > 0.3) {
        style = PLAY_STYLES.INFLUENCE;
        styleDetail = '中央の厚みを重視するスタイルです。壮大な構想力がありますが、地合いで遅れることがあります。';
    } else if (scores.stability > 75) {
        style = PLAY_STYLES.DEFENSIVE;
        styleDetail = '安定性を重視する手堅いスタイルです。大きなミスは少ないですが、攻めの場面でチャンスを逃すことがあります。';
    } else {
        style = PLAY_STYLES.BALANCED;
        styleDetail = 'バランスの取れたオールラウンダーです。状況に応じて攻守を切り替えられます。';
    }

    return {
        style,
        label: STYLE_LABELS[style],
        detail: styleDetail,
        metrics: {
            centerRatio: Math.round(centerRatio * 100),
            edgeRatio: Math.round(edgeRatio * 100),
            leadingBlunderRate: Math.round(leadingBlunderRate * 100),
            trailingAggressionRate: Math.round(trailingAggressionRate * 100)
        }
    };
}

// ヘルパー関数
function getSeverity(score) {
    if (score < 40) return 'critical';
    if (score < 55) return 'high';
    return 'medium';
}

function generateFusekiDetail(score, winRates) {
    const earlyRates = winRates.filter(wr => wr.moveNumber <= 20);
    const avgDrop = earlyRates.reduce((sum, wr) => sum + Math.min(0, wr.delta), 0);
    if (avgDrop < -10) {
        return '序盤20手以内で大きく勝率を落としています。定石の理解と布石の基本パターンの学習が急務です。';
    }
    return '布石段階での勝率低下が目立ちます。序盤の構想力を鍛える必要があります。';
}

function generateShikatsuDetail(score, winRates) {
    const bigDrops = winRates.filter(wr => wr.delta < -10);
    if (bigDrops.length >= 3) {
        return `${bigDrops.length}回の致命的なミスが検出されました。石の死活に関する基本パターンの反復練習が必要です。`;
    }
    return '死活に関する判断ミスが見られます。詰碁の練習で改善が期待できます。';
}

function generateYoseDetail(score, winRates) {
    const yoseRates = winRates.filter(wr => wr.moveNumber > 150);
    const reversals = yoseRates.filter(wr => Math.abs(wr.delta) > 3).length;
    if (reversals >= 3) {
        return `ヨセ段階で${reversals}回の大きな勝率変動があります。ヨセの計算力と手順の精度向上が必要です。`;
    }
    return 'ヨセでの損が蓄積しています。ヨセの大小判断とテクニックの学習を推奨します。';
}

function getScoreLabel(key) {
    const labels = {
        fuseki: '布石力',
        chuban: '中盤戦闘力',
        shikatsu: '死活精度',
        yose: 'ヨセ精度',
        stability: '安定性',
        judgment: '判断力'
    };
    return labels[key] || key;
}
