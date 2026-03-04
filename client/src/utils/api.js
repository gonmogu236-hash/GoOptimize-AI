const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

/**
 * SGFファイルを解析APIに送信
 * @param {File} file - SGFファイル
 * @param {string} playerColor - ユーザーの色 ('B' or 'W')
 */
export async function analyzeSGF(file, playerColor = 'B') {
    const formData = new FormData();
    formData.append('sgf', file);
    formData.append('playerColor', playerColor);

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
 * @param {string} sgfText - SGFテキスト
 * @param {string} playerColor - ユーザーの色 ('B' or 'W')
 */
export async function analyzeSGFText(sgfText, playerColor = 'B') {
    const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sgf: sgfText, playerColor })
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

/**
 * Stripe Checkout セッションを作成
 */
export async function createCheckoutSession() {
    const response = await fetch(`${API_BASE}/billing/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '決済セッションの作成に失敗しました');
    }

    return response.json();
}
