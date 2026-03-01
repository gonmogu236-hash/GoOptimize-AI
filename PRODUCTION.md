# GoOptimize AI - 本番公開（デプロイ）ガイド

このドキュメントでは、開発した GoOptimize AI を Web 上に公開し、実際の収益化（Stripe）を開始するための手順を説明します。

---

## 1. 必要なアカウントの準備
本番公開には以下のサービスのアカウント（無料プランでOK）が必要です：

- **GitHub**: ソースコードの管理とデプロイ連携に使用。
- **Vercel**: フロントエンド（React）のホスティングに使用。
- **Render** (または Fly.io/Railway): バックエンド（Express API）のホスティングに使用。
- **Stripe**: 決済処理に使用。

---

## 2. Stripe の本番設定
1. [Stripe ダッシュボード](https://dashboard.stripe.com/) にログイン。
2. **APIキー** を取得：
   - `STRIPE_SECRET_KEY` (シークレットキー): バックエンドで使用。
   - `VITE_STRIPE_PUBLISHABLE_KEY` (公開可能キー): フロントエンドで使用（現在はモックのため省略可）。
3. **Webhook の設定** (将来的な拡張時):
   - 決済完了をサーバーに通知するために Webhook エンドポイントを設定します。

---

## 3. バックエンドのデプロイ (Render)
1. **GitHub にリポジトリを作成**し、コードをプッシュします。
2. Render で **New -> Web Service** を選択。
3. リポジトリを連携し、以下の設定を入力：
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment Variables**: 以下の変数を設定。

### サーバー側の `.env` 設定 (Render の設定画面で入力)
```env
PORT=3001
STRIPE_SECRET_KEY=sk_live_... (取得したキー)
DATABASE_URL=... (将来的に PostgreSQL を使う場合)
```

---

## 4. フロントエンドのデプロイ (Vercel)
1. Vercel で **Add New -> Project** を選択。
2. リポジトリを連携。
3. **Root Directory**: `client` を指定。
4. **Environment Variables**:
   - `VITE_API_URL`: Render で公開したバックエンドの URL (例: `https://go-optimize-api.onrender.com`)

---

## 5. データベースの移行
現在は SQLite (`go_optimize.db`) を使用していますが、Render 等の無料プランではファイル保存が永続化されない場合があります。
**推奨**: [Supabase](https://supabase.com/) 等の無料 PostgreSQL データベースを作成し、`DATABASE_URL` を設定することで、データを安全に保持できます。

---

## 6. あなたが次に行うべきこと
1. **GitHub へのプッシュ**:
   - ターミナルで `git push origin main` を実行（リモートURL設定後）。
2. **環境変数の入力**:
   - 上記ガイドに従い、各サービスの管理画面で API キーを入力してください。
3. **ドメインの設定** (任意):
   - お持ちの独自ドメインを Vercel に紐付けることで、プロフェッショナルな URL で公開できます。

---

💡 **サポートが必要な場合**
APIキーの具体的な埋め込み方法や、特定のサービスでのビルドエラーが発生した際は、いつでもお知らせください。
