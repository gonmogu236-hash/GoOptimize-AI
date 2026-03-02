import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

/**
 * Stripeのインスタンスを必要時に作成（起動時のクラッシュを防止）
 */
function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    return new Stripe(key);
}

router.post('/create-checkout-session', async (req, res) => {
    try {
        const stripe = getStripe();
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
