/**
 * SGF (Smart Game Format) Parser
 * SGFファイルを解析し、ゲームデータを構造化する
 */

/**
 * SGFファイルをパースしてゲームデータを返す
 * @param {string} sgfContent - SGFファイルの内容
 * @returns {object} パースされたゲームデータ
 */
export function parseSGF(sgfContent) {
    const result = {
        metadata: {},
        moves: [],
        comments: []
    };

    // メタデータ抽出
    const metaPatterns = {
        size: /SZ\[(\d+)\]/,
        komi: /KM\[([\d.]+)\]/,
        playerBlack: /PB\[([^\]]*)\]/,
        playerWhite: /PW\[([^\]]*)\]/,
        result: /RE\[([^\]]*)\]/,
        date: /DT\[([^\]]*)\]/,
        rules: /RU\[([^\]]*)\]/,
        application: /AP\[([^\]]*)\]/
    };

    for (const [key, pattern] of Object.entries(metaPatterns)) {
        const match = sgfContent.match(pattern);
        if (match) {
            result.metadata[key] = match[1];
        }
    }

    // デフォルト盤サイズ
    result.metadata.size = parseInt(result.metadata.size || '19');
    result.metadata.komi = parseFloat(result.metadata.komi || '6.5');

    // 着手抽出
    const movePattern = /;(B|W)\[([a-s]{0,2})\]/g;
    let match;
    let moveNumber = 0;

    while ((match = movePattern.exec(sgfContent)) !== null) {
        moveNumber++;
        const color = match[1]; // B or W
        const coords = match[2];

        if (coords.length === 0) {
            // パス
            result.moves.push({
                number: moveNumber,
                color,
                x: -1,
                y: -1,
                pass: true
            });
        } else {
            const x = coords.charCodeAt(0) - 97; // 'a' = 0
            const y = coords.charCodeAt(1) - 97;
            result.moves.push({
                number: moveNumber,
                color,
                x,
                y,
                pass: false
            });
        }
    }

    // コメント抽出
    const commentPattern = /C\[([^\]]*)\]/g;
    while ((match = commentPattern.exec(sgfContent)) !== null) {
        result.comments.push(match[1]);
    }

    result.metadata.totalMoves = moveNumber;

    return result;
}

/**
 * パースされた着手データのバリデーション
 */
export function validateSGF(sgfContent) {
    if (!sgfContent || typeof sgfContent !== 'string') {
        return { valid: false, error: 'SGFデータが空です' };
    }

    if (!sgfContent.includes('(;')) {
        return { valid: false, error: 'SGF形式ではありません' };
    }

    const hasBlack = /;B\[/.test(sgfContent);
    const hasWhite = /;W\[/.test(sgfContent);

    if (!hasBlack && !hasWhite) {
        return { valid: false, error: '着手データが見つかりません' };
    }

    return { valid: true };
}
