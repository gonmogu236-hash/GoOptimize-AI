const API_BASE = '/api';

/**
 * SGFファイルを解析APIに送信
 */
export async function analyzeSGF(file) {
    const formData = new FormData();
    formData.append('sgf', file);

    const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '解析に失敗しました');
    }

    return response.json();
}

/**
 * SGFテキストを直接解析
 */
export async function analyzeSGFText(sgfText) {
    const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sgf: sgfText })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '解析に失敗しました');
    }

    return response.json();
}

/**
 * 解析結果を取得
 */
export async function getAnalysis(id) {
    const response = await fetch(`${API_BASE}/analysis/${id}`);
    if (!response.ok) throw new Error('解析結果の取得に失敗しました');
    return response.json();
}

/**
 * 解析履歴を取得
 */
export async function getHistory() {
    const response = await fetch(`${API_BASE}/history`);
    if (!response.ok) throw new Error('履歴の取得に失敗しました');
    return response.json();
}
