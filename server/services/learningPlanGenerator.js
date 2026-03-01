/**
 * 学習プラン生成エンジン
 * 弱点分析結果に基づいてパーソナライズされた学習プランを生成
 * 将来的にLLM APIに差し替え可能
 */

/**
 * 学習プランを生成
 */
export function generateLearningPlan(scores, weaknesses, playStyle, estimatedRank) {
    return {
        weeklyPlan: generateWeeklyPlan(weaknesses, playStyle),
        monthlyPlan: generateMonthlyPlan(weaknesses, playStyle, estimatedRank),
        recommendations: generateRecommendations(weaknesses, playStyle),
        dailyRoutine: generateDailyRoutine(weaknesses),
        targetRank: getNextRank(estimatedRank)
    };
}

function generateWeeklyPlan(weaknesses, playStyle) {
    const weeks = [];
    const primaryWeakness = weaknesses[0];
    const secondaryWeakness = weaknesses.length > 1 ? weaknesses[1] : null;

    // Week 1: 最大の弱点にフォーカス
    weeks.push({
        week: 1,
        theme: getWeekTheme(primaryWeakness),
        tasks: getWeekTasks(primaryWeakness, 1),
        problemCount: getProblemCount(primaryWeakness, 1),
        gameCount: 2,
        reviewRequired: true
    });

    // Week 2: 副次的弱点 or 初週の深掘り
    if (secondaryWeakness) {
        weeks.push({
            week: 2,
            theme: getWeekTheme(secondaryWeakness),
            tasks: getWeekTasks(secondaryWeakness, 2),
            problemCount: getProblemCount(secondaryWeakness, 2),
            gameCount: 2,
            reviewRequired: false
        });
    } else {
        weeks.push({
            week: 2,
            theme: `${getWeekTheme(primaryWeakness)}（応用編）`,
            tasks: [
                '先週の課題の復習と定着確認',
                '実戦棋譜で弱点パターンを確認',
                '類似局面の反復練習'
            ],
            problemCount: 30,
            gameCount: 3,
            reviewRequired: true
        });
    }

    // Week 3: 実戦トレーニング
    weeks.push({
        week: 3,
        theme: '実戦力強化ウィーク',
        tasks: [
            '集中対局（3〜5局）',
            '各局の自己レビュー',
            '弱点パターンの出現確認',
            '改善度をスコアで確認'
        ],
        problemCount: 15,
        gameCount: 5,
        reviewRequired: true
    });

    // Week 4: 総合力アップ
    weeks.push({
        week: 4,
        theme: '総合力チェック＆次月準備',
        tasks: [
            '全分野の総合問題',
            '月間進捗の振り返り',
            '苦手分野の追加練習',
            '3局以上の実戦 + 詳細レビュー'
        ],
        problemCount: 20,
        gameCount: 3,
        reviewRequired: true
    });

    return weeks;
}

function generateMonthlyPlan(weaknesses, playStyle, rank) {
    const months = [];

    // Month 1: 基礎固め
    months.push({
        month: 1,
        goal: '弱点の基礎固め',
        focus: weaknesses.slice(0, 2).map(w => w.label),
        targetImprovement: '+5〜10点',
        description: '最も大きな弱点に集中して基礎力を底上げします。'
    });

    // Month 2: 応用力
    months.push({
        month: 2,
        goal: '応用力の強化',
        focus: ['実戦での弱点克服', '新しいパターンの習得'],
        targetImprovement: '+5〜8点',
        description: '実戦を通じて学んだ知識を定着させます。'
    });

    // Month 3: 総合力アップ
    months.push({
        month: 3,
        goal: '総合力の向上',
        focus: ['バランスの良い学習', '安定した実力の発揮'],
        targetImprovement: '+3〜5点',
        description: '全分野をバランスよく強化し、安定した棋力を目指します。'
    });

    return months;
}

function generateRecommendations(weaknesses, playStyle) {
    const recs = [];

    for (const weakness of weaknesses) {
        switch (weakness.type) {
            case 'fuseki_weak':
                recs.push({
                    category: '布石',
                    items: [
                        { name: '基本定石50型', type: 'study', priority: 'high' },
                        { name: '布石の考え方（入門〜初段）', type: 'book', priority: 'high' },
                        { name: 'プロの序盤を並べる（1日1局）', type: 'practice', priority: 'medium' }
                    ]
                });
                break;
            case 'shikatsu_weak':
                recs.push({
                    category: '死活',
                    items: [
                        { name: '基本死活事典（初級編）', type: 'book', priority: 'high' },
                        { name: '毎日詰碁20問', type: 'practice', priority: 'high' },
                        { name: '実戦死活の復習', type: 'review', priority: 'medium' }
                    ]
                });
                break;
            case 'yose_weak':
                recs.push({
                    category: 'ヨセ',
                    items: [
                        { name: 'ヨセの基本テクニック', type: 'study', priority: 'high' },
                        { name: 'ヨセ問題集（計算力強化）', type: 'practice', priority: 'high' },
                        { name: '終盤の手順確認練習', type: 'practice', priority: 'medium' }
                    ]
                });
                break;
            case 'chuban_weak':
                recs.push({
                    category: '中盤',
                    items: [
                        { name: '攻め合いの基本パターン', type: 'study', priority: 'high' },
                        { name: '中盤の形勢判断練習', type: 'practice', priority: 'high' },
                        { name: 'プロの中盤戦の棋譜並べ', type: 'practice', priority: 'medium' }
                    ]
                });
                break;
            case 'stability_weak':
                recs.push({
                    category: '安定性',
                    items: [
                        { name: '持ち時間を多めに設定して対局', type: 'practice', priority: 'high' },
                        { name: '一手一手の確認癖をつける', type: 'mindset', priority: 'high' },
                        { name: '対局後の自己レビュー', type: 'review', priority: 'medium' }
                    ]
                });
                break;
            default:
                recs.push({
                    category: '総合',
                    items: [
                        { name: '棋譜並べ（1日1局）', type: 'practice', priority: 'medium' },
                        { name: '詰碁（毎日10問）', type: 'practice', priority: 'medium' },
                        { name: '実戦（週3局以上）', type: 'practice', priority: 'medium' }
                    ]
                });
        }
    }

    // プレイスタイル別の追加推奨
    if (playStyle.style === 'self_destruct') {
        recs.push({
            category: 'メンタル強化',
            items: [
                { name: '優勢時の安全策を意識する', type: 'mindset', priority: 'high' },
                { name: '「勝ちを急がない」練習対局', type: 'practice', priority: 'high' }
            ]
        });
    }

    return recs;
}

function generateDailyRoutine(weaknesses) {
    const routine = [
        { time: '朝（15分）', activity: '詰碁10問', category: 'warmup' },
    ];

    const primary = weaknesses[0];
    if (primary) {
        routine.push({
            time: '隙間時間（20分）',
            activity: getDailyPractice(primary),
            category: 'focus'
        });
    }

    routine.push({
        time: '夕方（30分）',
        activity: '実戦1局 or 棋譜並べ1局',
        category: 'practice'
    });

    routine.push({
        time: '夜（10分）',
        activity: '対局振り返りメモ',
        category: 'review'
    });

    return routine;
}

// ヘルパー関数
function getWeekTheme(weakness) {
    if (!weakness) return '総合力強化';
    const themes = {
        fuseki_weak: '布石力集中トレーニング',
        shikatsu_weak: '死活マスターウィーク',
        yose_weak: 'ヨセ精度向上ウィーク',
        chuban_weak: '中盤戦闘力強化',
        stability_weak: '安定性トレーニング',
        judgment_weak: '判断力集中改善'
    };
    return themes[weakness.type] || '総合力強化';
}

function getWeekTasks(weakness, weekNum) {
    if (!weakness) return ['詰碁毎日15問', '実戦2局', '棋譜並べ1局'];

    const taskSets = {
        fuseki_weak: [
            '基本定石パターンの暗記（10型）',
            '序盤の打ち方を本で学習',
            'プロの布石を3局並べる',
            '実戦で布石を意識した2局'
        ],
        shikatsu_weak: [
            '基本死活50問に挑戦',
            '眼のある形・ない形の分類練習',
            '実戦で死活が絡む場面を記録',
            '失敗パターンの反復練習'
        ],
        yose_weak: [
            'ヨセの大小判断練習（20問）',
            '先手・後手の見極め練習',
            'ヨセ手筋の基本パターン学習',
            '実戦でヨセを丁寧に打つ（2局）'
        ],
        chuban_weak: [
            '攻め合いの基本パターン（20問）',
            'サバキの手筋学習',
            '形勢判断の練習',
            '実戦で中盤を意識した2局'
        ],
        stability_weak: [
            '持ち時間を長めにして2局打つ',
            '毎手30秒考える練習',
            '対局後に3つのミスをメモする',
            '感情コントロールの意識'
        ],
        judgment_weak: [
            '棋譜並べで次の一手を予想',
            '形勢判断クイズ（15問）',
            '自分の棋譜の悪手を見つける練習',
            '実戦2局 + 全手振り返り'
        ]
    };

    return taskSets[weakness.type] || taskSets.judgment_weak;
}

function getProblemCount(weakness, weekNum) {
    if (!weakness) return 20;
    const counts = {
        fuseki_weak: 20,
        shikatsu_weak: 50,
        yose_weak: 30,
        chuban_weak: 25,
        stability_weak: 15,
        judgment_weak: 20
    };
    return counts[weakness.type] || 20;
}

function getDailyPractice(weakness) {
    const practices = {
        fuseki_weak: '定石パターン暗記 or 布石並べ',
        shikatsu_weak: '詰碁20問',
        yose_weak: 'ヨセ計算問題15問',
        chuban_weak: '手筋問題15問',
        stability_weak: '棋譜並べ（集中して1局）',
        judgment_weak: '次の一手問題15問'
    };
    return practices[weakness.type] || '詰碁15問';
}

function getNextRank(currentRank) {
    const ranks = ['4級以下', '3級', '2級', '1級', '初段', '二段', '三段', '四段', '五段以上'];
    const idx = ranks.indexOf(currentRank);
    if (idx < 0 || idx >= ranks.length - 1) return currentRank;
    return ranks[idx + 1];
}
