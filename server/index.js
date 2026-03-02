/**
 * GoOptimize AI - Express APIサーバー
 */

import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import analysisRoutes from './routes/analysis.js';
import billingRoutes from './routes/billing.js'; // Added import for billing routes
import { initDB } from './db/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 GoOptimize AI Server is starting...');
console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: PORT
});

// ミドルウェア
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Changed limit from '5mb' to '50mb'
app.use(express.urlencoded({ extended: true }));

// APIルート
app.use('/api', analysisRoutes);
app.use('/api/billing', billingRoutes); // Added billing routes

// ヘルスチェック
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'GoOptimize AI' });
});

// サーバー起動
async function start() {
    try {
        await initDB();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🎯 GoOptimize AI Server is LIVE and listening on port ${PORT}`);
            console.log(`Health check available at: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
