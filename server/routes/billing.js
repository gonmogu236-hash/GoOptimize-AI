import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

// 本番環境・テスト環境では環境変数からシークレットキーを読み込む
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
    try {
        // Stripe Checkout セッションの作成
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'jpy',
                        product_data: {
                            name: 'GoOptimize AI プレミアム解析',
                            description: '詳細レポート・推奨正解手の表示・PDF出力',
                        },
                        unit_amount: 300,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // RenderやVercelのドメインに合わせて動的にリダイレクト
            success_url: `${req.headers.origin}/?payment=success`,
            cancel_url: `${req.headers.origin}/?payment=cancel`,
        });

        res.json({ id: session.id, url: session.url });

    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: '決済セッションの作成に失敗しました。APIキーが正しく設定されているか確認してください。' });
    }
});

export default router;
