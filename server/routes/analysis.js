/**
 * 解析APIルート
 */

import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { parseSGF, validateSGF } from '../services/sgfParser.js';
import { classifyMoves, getPhaseStats } from '../services/phaseClassifier.js';
import { generateWinRateCurve, calculateScores } from '../services/scoreEngine.js';
import { detectWeaknesses, analyzePlayStyle } from '../services/weaknessDetector.js';
import { generateDiagnostic } from '../services/diagnosticGenerator.js';
import { generateLearningPlan } from '../services/learningPlanGenerator.js';
import { getDB, saveDB } from '../db/schema.js';

const router = Router();

// ファイルアップロード設定（メモリストレージ）
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 }, // 1MB上限
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.sgf') || file.mimetype === 'application/x-go-sgf') {
            cb(null, true);
        } else {
            cb(new Error('SGFファイルのみアップロード可能です'), false);
        }
    }
});

/**
 * POST /api/analyze
 * SGFファイルを受け取り、解析を実行
 * playerColor: 'B' or 'W' — ユーザーがどちら側で打ったか
 */
router.post('/analyze', upload.single('sgf'), async (req, res) => {
    try {
        let sgfContent;

        if (req.file) {
            sgfContent = req.file.buffer.toString('utf-8');
        } else if (req.body.sgf) {
            sgfContent = req.body.sgf;
        } else {
            return res.status(400).json({ error: 'SGFファイルまたはSGFテキストを提供してください' });
        }

        // ユーザーの色（デフォルト: 黒）
        const playerColor = req.body.playerColor === 'W' ? 'W' : 'B';

        // バリデーション
        const validation = validateSGF(sgfContent);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        // 1. SGFパース
        const gameData = parseSGF(sgfContent);

        // 2. フェーズ分類
        const phaseStats = getPhaseStats(gameData.moves);

        // 3. 勝率推移生成（全手で生成、ユーザー色に合わせて方向を調整）
        const winRates = generateWinRateCurve(gameData.moves, gameData.metadata, playerColor);

        // 4. スコア計算（ユーザーの手番のみ対象）
        const scores = calculateScores(gameData.moves, winRates, playerColor);

        // 5. 弱点検出
        const weaknesses = detectWeaknesses(scores, winRates, playerColor);

        // 6. プレイスタイル分析（ユーザーの手番のみ）
        const playStyle = analyzePlayStyle(gameData.moves, scores, winRates, playerColor);

        // 7. 診断文生成
        const diagnostic = generateDiagnostic(scores, weaknesses, playStyle, gameData.metadata);

        // 8. 学習プラン生成
        const learningPlan = generateLearningPlan(
            scores, weaknesses, playStyle, diagnostic.estimatedRank
        );

        // DB保存
        const gameId = uuidv4();
        const analysisId = uuidv4();

        try {
            const db = getDB();

            db.run(
                `INSERT INTO games (id, sgf_content, player_black, player_white, result, total_moves, komi, date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    gameId,
                    sgfContent,
                    gameData.metadata.playerBlack || 'Unknown',
                    gameData.metadata.playerWhite || 'Unknown',
                    gameData.metadata.result || '',
                    gameData.metadata.totalMoves,
                    gameData.metadata.komi,
                    gameData.metadata.date || ''
                ]
            );

            db.run(
                `INSERT INTO analysis_results (id, game_id, scores_json, win_rates_json, weaknesses_json, play_style_json, diagnostic_json, learning_plan_json, estimated_rank)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    analysisId,
                    gameId,
                    JSON.stringify(scores),
                    JSON.stringify(winRates),
                    JSON.stringify(weaknesses),
                    JSON.stringify(playStyle),
                    JSON.stringify(diagnostic),
                    JSON.stringify(learningPlan),
                    diagnostic.estimatedRank
                ]
            );

            saveDB();
        } catch (dbError) {
            console.error('DB save error (non-fatal):', dbError.message);
        }

        // レスポンス（playerColor を含める）
        res.json({
            id: analysisId,
            gameId,
            playerColor,
            metadata: gameData.metadata,
            moves: gameData.moves,
            phaseStats,
            scores,
            winRates,
            weaknesses,
            playStyle,
            diagnostic,
            learningPlan
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: '解析中にエラーが発生しました: ' + error.message });
    }
});

/**
 * GET /api/analysis/:id
 * 保存された解析結果を取得
 */
router.get('/analysis/:id', (req, res) => {
    try {
        const db = getDB();
        const result = db.exec(
            `SELECT a.*, g.player_black, g.player_white, g.result, g.total_moves, g.komi, g.date
       FROM analysis_results a
       JOIN games g ON a.game_id = g.id
       WHERE a.id = ?`,
            [req.params.id]
        );

        if (!result.length || !result[0].values.length) {
            return res.status(404).json({ error: '解析結果が見つかりません' });
        }

        const row = result[0].values[0];
        const columns = result[0].columns;
        const data = {};
        columns.forEach((col, i) => { data[col] = row[i]; });

        res.json({
            id: data.id,
            gameId: data.game_id,
            metadata: {
                playerBlack: data.player_black,
                playerWhite: data.player_white,
                result: data.result,
                totalMoves: data.total_moves,
                komi: data.komi,
                date: data.date
            },
            scores: JSON.parse(data.scores_json),
            winRates: JSON.parse(data.win_rates_json),
            weaknesses: JSON.parse(data.weaknesses_json),
            playStyle: JSON.parse(data.play_style_json),
            diagnostic: JSON.parse(data.diagnostic_json),
            learningPlan: JSON.parse(data.learning_plan_json),
            estimatedRank: data.estimated_rank
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/history
 * 過去の解析履歴を取得
 */
router.get('/history', (req, res) => {
    try {
        const db = getDB();
        const result = db.exec(
            `SELECT a.id, a.estimated_rank, a.created_at, g.player_black, g.player_white, g.result, g.total_moves
       FROM analysis_results a
       JOIN games g ON a.game_id = g.id
       ORDER BY a.created_at DESC
       LIMIT 20`
        );

        if (!result.length) {
            return res.json([]);
        }

        const rows = result[0].values.map(row => {
            const data = {};
            result[0].columns.forEach((col, i) => { data[col] = row[i]; });
            return data;
        });

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
