/**
 * 診断文生成エンジン
 * テンプレート＋ルールベースで診断文を自動生成
 * 将来的にLLM APIに差し替え可能
 */

import { PLAY_STYLES, STYLE_LABELS } from './weaknessDetector.js';

/**
 * 総合診断文を生成
 */
export function generateDiagnostic(scores, weaknesses, playStyle, metadata) {
    const sections = [];

    // 1. 概要
    sections.push(generateOverview(scores, playStyle, metadata));

    // 2. 強み
    sections.push(generateStrengths(scores));

    // 3. 弱点分析
    sections.push(generateWeaknessAnalysis(weaknesses));

    // 4. プレイスタイル分析
    sections.push(generateStyleAnalysis(playStyle));

    // 5. 推定棋力
    const estimatedRank = estimateRank(scores.overall);

    // 6. 総評
    sections.push(generateSummary(scores, weaknesses, estimatedRank));

    return {
        sections,
        estimatedRank,
        headline: generateHeadline(playStyle, weaknesses)
    };
}

function generateOverview(scores, playStyle, metadata) {
    const totalMoves = metadata.totalMoves || 0;
    const result = metadata.result || '不明';

    return {
        title: '対局概要',
        content: `全${totalMoves}手の対局（結果: ${result}）を分析しました。` +
            `総合スコアは${scores.overall}点で、${getOverallLevel(scores.overall)}です。` +
            `あなたのプレイスタイルは「${playStyle.label}」と判定されました。`
    };
}

function generateStrengths(scores) {
    const scoreEntries = [
        { key: 'fuseki', label: '布石力', score: scores.fuseki },
        { key: 'chuban', label: '中盤戦闘力', score: scores.chuban },
        { key: 'shikatsu', label: '死活精度', score: scores.shikatsu },
        { key: 'yose', label: 'ヨセ精度', score: scores.yose },
        { key: 'stability', label: '安定性', score: scores.stability },
        { key: 'judgment', label: '判断力', score: scores.judgment }
    ].sort((a, b) => b.score - a.score);

    const strengths = scoreEntries.filter(s => s.score >= 70);

    if (strengths.length === 0) {
        return {
            title: '強みの分析',
            content: '現時点では突出した強みは見られませんが、バランスの良い成長が期待できます。'
        };
    }

    const topStrength = strengths[0];
    let content = `最も優れている分野は「${topStrength.label}」(${topStrength.score}点)です。`;

    if (strengths.length > 1) {
        content += `また、${strengths.slice(1).map(s => `「${s.label}」(${s.score}点)`).join('、')}も高水準です。`;
    }

    return { title: '強みの分析', content };
}

function generateWeaknessAnalysis(weaknesses) {
    if (weaknesses.length === 0) {
        return {
            title: '改善ポイント',
            content: '大きな弱点は見当たりません。各分野の更なる精度向上を目指しましょう。'
        };
    }

    const critical = weaknesses.filter(w => w.severity === 'critical');
    const high = weaknesses.filter(w => w.severity === 'high');
    const medium = weaknesses.filter(w => w.severity === 'medium');

    let content = '';

    if (critical.length > 0) {
        content += `⚠️ 最も改善が急務な分野: ${critical.map(w => `「${w.label}」(${w.score}点)`).join('、')}。`;
        content += critical.map(w => w.detail).join(' ');
    }

    if (high.length > 0) {
        content += ` 重点改善ポイント: ${high.map(w => `「${w.label}」(${w.score}点)`).join('、')}。`;
    }

    if (medium.length > 0) {
        content += ` 改善の余地あり: ${medium.map(w => `「${w.label}」(${w.score}点)`).join('、')}。`;
    }

    return { title: '改善ポイント', content: content.trim() };
}

function generateStyleAnalysis(playStyle) {
    const styleDescriptions = {
        [PLAY_STYLES.AGGRESSIVE]:
            '積極的に戦いを仕掛けるスタイルです。攻めの切れ味が武器ですが、' +
            '過度の攻撃が裏目に出ることもあります。' +
            'バランスを保ちながら攻める技術を磨くことで、さらに強くなれます。',
        [PLAY_STYLES.DEFENSIVE]:
            '堅実で安定したプレイスタイルです。大きなミスが少なく信頼性があります。' +
            'しかし、時にはリスクを取って勝負に出る大胆さも必要です。' +
            '攻めのパターンを増やすことで棋力の幅が広がります。',
        [PLAY_STYLES.BALANCED]:
            'バランスの取れたオールラウンドなスタイルです。' +
            '状況に応じた柔軟な対応ができていますが、特化した武器を持つことで' +
            'さらにレベルアップできます。',
        [PLAY_STYLES.SELF_DESTRUCT]:
            '優勢を築く力はありますが、リード時に緩んでしまう傾向があります。' +
            '「勝っている時こそ慎重に」を意識することで、勝率が大幅に改善されるでしょう。',
        [PLAY_STYLES.TERRITORY]:
            '実利を着実に稼ぐ堅実なスタイルです。地合い計算に長けていますが、' +
            '中央の主導権争いで後手に回ることがあります。',
        [PLAY_STYLES.INFLUENCE]:
            '厚みを重視した壮大な碁を打つスタイルです。' +
            '大局観に優れていますが、実利とのバランスを取る練習が有効です。'
    };

    return {
        title: `プレイスタイル: ${playStyle.label}`,
        content: styleDescriptions[playStyle.style] || playStyle.detail
    };
}

function generateSummary(scores, weaknesses, rank) {
    let content = `推定棋力は「${rank}」です。`;

    if (weaknesses.length > 0 && weaknesses[0].severity === 'critical') {
        content += `特に「${weaknesses[0].label}」の改善に集中することで、最も効率的な棋力向上が見込めます。`;
    } else if (weaknesses.length > 0) {
        content += `「${weaknesses[0].label}」を中心に学習することで、着実なレベルアップが期待できます。`;
    } else {
        content += '全体的にバランスの良い棋力です。各分野の精度向上を心がけましょう。';
    }

    return { title: '総評', content };
}

function generateHeadline(playStyle, weaknesses) {
    const headlines = {
        [PLAY_STYLES.AGGRESSIVE]: '攻めの鬼 — でも時々暴走します',
        [PLAY_STYLES.DEFENSIVE]: '鉄壁の守り — しかし攻めが物足りない',
        [PLAY_STYLES.BALANCED]: 'バランスの達人 — 次のステージへ',
        [PLAY_STYLES.SELF_DESTRUCT]: '優勢キラー — 勝ちを手放す癖あり',
        [PLAY_STYLES.TERRITORY]: '実利の狩人 — 中央が課題',
        [PLAY_STYLES.INFLUENCE]: '厚みの芸術家 — 実利とのバランスを'
    };

    let headline = headlines[playStyle.style] || `${playStyle.label}タイプ`;

    if (weaknesses.length > 0 && weaknesses[0].severity === 'critical') {
        headline += ` 🔥 ${weaknesses[0].label}に要注意`;
    }

    return headline;
}

/**
 * 推定棋力
 */
function estimateRank(overallScore) {
    if (overallScore >= 90) return '五段以上';
    if (overallScore >= 82) return '四段';
    if (overallScore >= 74) return '三段';
    if (overallScore >= 66) return '二段';
    if (overallScore >= 58) return '初段';
    if (overallScore >= 50) return '1級';
    if (overallScore >= 42) return '2級';
    if (overallScore >= 34) return '3級';
    return '4級以下';
}

function getOverallLevel(score) {
    if (score >= 85) return '非常に高いレベル';
    if (score >= 70) return '高いレベル';
    if (score >= 55) return '中級レベル';
    if (score >= 40) return '発展途上';
    return '基礎固めが必要なレベル';
}
