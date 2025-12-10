# 新規顧客へのアプリ提供ガイド

## 概要

このガイドでは、日報管理システムを新規顧客に提供する際の手順と注意点をまとめています。

## 基本概念

### マスターリポジトリとクローンの関係

プログラミングの「クラスとインスタンス」の関係と同じです：

```
マスターリポジトリ（クラス定義）
  ├── 共通機能（メソッド）
  ├── ソースコード
  └── 設定ファイル

     ↓ git clone（インスタンス化）

顧客用クローン（インスタンス）
  ├── 顧客専用の .env（コンストラクタ引数）
  ├── 顧客専用のデータベース（状態）
  └── カスタマイズ（オーバーライド）
```

### なぜ Git Clone を使うのか

| 方法 | メリット | デメリット |
|---|---|---|
| **Git Clone（推奨）** | ・Git履歴が保持される<br>・`git pull` で簡単にアップデート<br>・マージが自動<br>・Vercel自動デプロイ対応 | ・Gitが必要 |
| **ZIP ダウンロード** | ・Git不要<br>・ワンクリック | ・Git履歴が消える<br>・アップデートが手動<br>・マージが困難<br>・バージョン管理不可 |

### なぜ npm install が必要なのか

- `node_modules/` は巨大（500MB〜1GB）なのでコピーしない
- `.gitignore` で除外されている
- `package.json` を元に各環境で生成する
- OS/アーキテクチャに適したバイナリをインストール

**重要**: パッケージの重複は発生しません
- `package.json` は設計図（2KB）
- `npm install` が設計図を元にダウンロード
- 各プロジェクトで独立した `node_modules/` を生成

## 新規顧客への提供手順

### ステップ1: マスターリポジトリからクローン

```bash
# 顧客A用のプロジェクトを作成
git clone https://github.com/Ishikawa-Yutaka/daily-report.git customer-a-daily-report

# ディレクトリに移動
cd customer-a-daily-report
```

**注意点**:
- ディレクトリ名は顧客名を含めると管理しやすい
- 例: `customer-a-daily-report`, `company-xyz-daily-report`

### ステップ2: 依存パッケージのインストール

```bash
npm install
```

**何が起こるか**:
1. `package.json` を読み取る
2. npm レジストリから全パッケージをダウンロード
3. `node_modules/` ディレクトリを生成
4. 環境に適したバイナリをインストール

### ステップ3: 環境変数の設定

```bash
# .envファイルを作成（顧客A専用の値）
cat > .env << 'EOF'
# 顧客A専用のデータベース接続
DATABASE_URL="postgresql://postgres:[PASSWORD-A]@db.[PROJECT-A-REF].supabase.co:5432/postgres"

# 顧客A専用のJWTシークレット（必ず他の顧客と異なる値を使用）
JWT_SECRET="customer-a-unique-secret-minimum-32-characters-xxxxx"

# 顧客A専用のSupabase設定
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-A-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[CUSTOMER-A-ANON-KEY]
EOF
```

**重要な注意点**:

#### ⚠️ セキュリティ上の絶対ルール

1. **JWT_SECRET は顧客ごとに必ず異なる値を使用**
   - 同じシークレットを使うと、顧客Aのトークンで顧客Bのシステムにアクセスできてしまう
   - 最低32文字以上
   - ランダムな文字列を生成

2. **DATABASE_URL は顧客ごとに完全に独立**
   - データベースを共有すると、データ漏洩のリスク
   - 各顧客専用のSupabaseプロジェクトを作成

3. **.env ファイルは絶対にGitにコミットしない**
   - `.gitignore` に必ず含まれていることを確認
   - 誤ってコミットすると機密情報が漏洩

#### JWT_SECRET の生成方法

```bash
# Node.jsで生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# または
openssl rand -hex 32
```

### ステップ4: データベースのセットアップ

#### 4-1. Supabaseプロジェクトの作成

1. https://supabase.com/dashboard にアクセス
2. "New Project" をクリック
3. 顧客専用のプロジェクトを作成
4. プロジェクト名: `customer-a-daily-report`
5. データベースパスワードを設定（安全な場所に保存）

#### 4-2. データベースマイグレーション

`MIGRATION.md` の手順に従って、Supabase の SQL エディタで以下の順番で SQL を実行：

```sql
-- 1. Users テーブルの作成
-- 2. DailyReports テーブルの作成
-- 3. Activities テーブルの作成
-- 4. AdminLog テーブルの作成
-- 5. is_super_admin カラムの追加
```

詳細は `MIGRATION.md` を参照してください。

#### 4-3. Prisma クライアントの生成

```bash
npx prisma generate
```

**何が起こるか**:
- `prisma/schema.prisma` を読み取る
- `.env` の `DATABASE_URL` でデータベースに接続
- TypeScript の型定義を生成
- Prisma Client を生成

### ステップ5: ローカルでテスト

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:3000 にアクセス
# 初回セットアップ: http://localhost:3000/setup
```

**テスト項目**:
- [ ] スーパーアドミンの作成（/setup）
- [ ] 管理者ログイン（/admin/login）
- [ ] 一般ユーザーの登録（/signup）
- [ ] 日報の作成・編集・削除
- [ ] 検索・フィルター機能
- [ ] 管理者機能（社員管理、操作ログ）

### ステップ6: Git リポジトリの管理（オプション）

#### オプション A: 顧客専用リポジトリを作成（推奨）

```bash
# 既存のGit履歴を削除
rm -rf .git

# 新しいリポジトリとして初期化
git init
git add .
git commit -m "Initial commit for Customer A"

# 顧客A専用のGitHubリポジトリにプッシュ
git remote add origin https://github.com/your-company/customer-a-daily-report.git
git push -u origin main

# マスターリポジトリを追跡するためのリモートを追加
git remote add upstream https://github.com/Ishikawa-Yutaka/daily-report.git
```

**メリット**:
- 顧客ごとの変更を独立管理
- セキュリティが高い
- カスタマイズが容易

#### オプション B: ブランチで管理

```bash
# 顧客A専用のブランチを作成
git checkout -b customer-a

# 変更をコミット
git add .
git commit -m "Customer A: initial setup"
git push -u origin customer-a
```

**メリット**:
- 1つのリポジトリで管理
- マスターの改善を反映しやすい

**デメリット**:
- ブランチ管理が複雑
- 誤マージのリスク

### ステップ7: Vercel へのデプロイ

#### 7-1. Vercel CLI のインストール（初回のみ）

```bash
npm install -g vercel
```

#### 7-2. Vercel にログイン

```bash
npx vercel login
```

#### 7-3. プロジェクトをデプロイ

```bash
# プレビューデプロイ
npx vercel

# Vercelが以下を自動実行:
# - Node.js環境のセットアップ
# - npm install
# - npm run build
# - デプロイ
```

#### 7-4. 環境変数の設定

Vercel ダッシュボードで環境変数を設定：

1. プロジェクトページを開く
2. "Settings" → "Environment Variables"
3. 以下の環境変数を追加：
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**重要**: 環境は "Production", "Preview", "Development" のすべてにチェック

#### 7-5. 本番環境へデプロイ

```bash
npx vercel --prod
```

### ステップ8: 初回セットアップ（本番環境）

```bash
# デプロイ完了後、ブラウザで以下にアクセス
https://customer-a-app.vercel.app/setup

# スーパーアドミンを作成
# - 社員番号（例: ADMIN001）
# - 社員名（例: システム管理者）
# - パスワード（6文字以上）
```

## マスターの更新を顧客に反映する

### マスターで新機能を開発

```bash
# マスターリポジトリで作業
cd /Users/Uni/Uni_MacBookAir/アプリ制作/日報アプリ/web

# 新機能を実装
# ... コーディング ...

# コミット
git add .
git commit -m "feat: PDF出力機能を追加"
git push
```

### 顧客Aに新機能を反映

```bash
# 顧客Aのプロジェクト
cd ~/Projects/customer-a-daily-report

# マスターの最新版を取得
git fetch upstream  # または origin
git merge upstream/main

# 依存パッケージが更新されている場合
npm install

# ローカルでテスト
npm run dev

# 問題なければデプロイ
git push  # Vercel自動デプロイ（GitHub連携している場合）
# または
npx vercel --prod
```

### 複数の顧客に一括反映

```bash
#!/bin/bash
# update-all-customers.sh

CUSTOMERS=("customer-a" "customer-b" "customer-c")

for CUSTOMER in "${CUSTOMERS[@]}"; do
  echo "Updating ${CUSTOMER}..."
  cd ~/Projects/${CUSTOMER}-daily-report

  git fetch upstream
  git merge upstream/main
  npm install

  # テストが成功したら自動デプロイ
  # npm test && git push

  echo "${CUSTOMER} updated successfully!"
done
```

## チェックリスト

各顧客へのデプロイ前に必ず確認：

### セキュリティ

- [ ] 新しいSupabaseプロジェクトを作成した
- [ ] `JWT_SECRET` が他の顧客と重複していない
- [ ] `DATABASE_URL` が顧客専用のデータベースを指している
- [ ] `.env` ファイルが `.gitignore` に含まれている
- [ ] 本番環境の `.env` とローカルの `.env` を混同していない

### データベース

- [ ] データベースマイグレーション（v1〜v4）をすべて実行した
- [ ] `npx prisma generate` を実行した
- [ ] データベース接続をテストした

### デプロイ

- [ ] Vercel に新しいプロジェクトとしてデプロイした
- [ ] Vercel の環境変数をすべて設定した
- [ ] `/setup` でスーパーアドミンを作成した

### 動作確認

- [ ] ログイン機能が動作する
- [ ] 日報作成・編集・削除が動作する
- [ ] 検索・フィルター機能が動作する
- [ ] 管理者機能が動作する
- [ ] 操作ログが記録される

## よくある問題と解決方法

### 問題1: Prisma Client が見つからない

```
Error: Cannot find module '@prisma/client'
```

**原因**: Prisma Client が生成されていない

**解決方法**:
```bash
npx prisma generate
npm run dev
```

### 問題2: データベース接続エラー

```
Error: Can't reach database server
```

**原因**: `DATABASE_URL` が間違っている

**解決方法**:
1. `.env` の `DATABASE_URL` を確認
2. Supabase の接続情報が正しいか確認
3. データベースパスワードが正しいか確認

### 問題3: JWT トークンのエラー

```
Error: Invalid token
```

**原因**:
- `JWT_SECRET` が設定されていない
- 顧客Aの `.env` と顧客Bの `.env` で `JWT_SECRET` が同じ

**解決方法**:
1. `.env` の `JWT_SECRET` を確認
2. 顧客ごとに異なる値を使用
3. 新しいシークレットを生成:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### 問題4: Vercel デプロイ時のビルドエラー

```
Error: Build failed
```

**原因**: 環境変数が設定されていない

**解決方法**:
1. Vercel ダッシュボードで環境変数を確認
2. すべての必須環境変数が設定されているか確認
3. 環境変数の値が正しいか確認

### 問題5: スーパーアドミンが作成できない

```
Error: セットアップは既に完了しています
```

**原因**: 既に管理者が存在する

**解決方法**:
- 既存の管理者でログインするか
- 手動でスーパーアドミンを作成（MIGRATION.md参照）

## ディレクトリ構成（推奨）

```
~/Projects/
├── daily-report/              # マスター（開発用）
│   ├── .git/                  # マスターのGit履歴
│   ├── app/
│   ├── components/
│   ├── .env.example          # 環境変数のテンプレート
│   ├── README.md
│   ├── MIGRATION.md
│   └── ...
│
├── customer-a-daily-report/   # 顧客A用
│   ├── .git/                  # 顧客A専用のGit
│   ├── app/
│   ├── .env                   # 顧客A専用（.gitignore）
│   └── ...
│
├── customer-b-daily-report/   # 顧客B用
│   ├── .git/
│   ├── app/
│   ├── .env                   # 顧客B専用
│   └── ...
│
└── customer-c-daily-report/   # 顧客C用
    ├── .git/
    ├── app/
    ├── .env                   # 顧客C専用
    └── ...
```

## セキュリティのベストプラクティス

### 絶対に守るべきこと

1. **顧客ごとに独立したデータベース**
   - データベースを共有しない
   - Supabase プロジェクトも顧客ごとに作成

2. **顧客ごとに異なる JWT_SECRET**
   - 同じシークレットは絶対に使わない
   - 最低32文字以上のランダムな文字列

3. **.env ファイルを Git にコミットしない**
   - `.gitignore` に `.env` が含まれているか確認
   - GitHub に誤ってプッシュしていないか確認

4. **本番環境の環境変数は Vercel で管理**
   - ローカルの `.env` とは別に管理
   - Environment Variables で設定

5. **パスワードは強力なものを使用**
   - スーパーアドミンのパスワードは特に重要
   - 12文字以上、英数字記号を含む

### 推奨事項

1. **顧客専用のプライベートリポジトリを作成**
   - 顧客の情報が他の顧客に漏れない
   - セキュリティが高い

2. **定期的にバックアップ**
   - Supabase の自動バックアップ機能を有効化
   - 重要なデータは定期的にエクスポート

3. **アクセスログを監視**
   - 操作ログ機能を活用
   - 不審なアクセスがないか定期確認

## まとめ

### マスターリポジトリ（クラス定義）

- 新機能の開発
- バグ修正
- すべての顧客に共通の改善
- 顧客固有の情報は含まない

### 顧客用クローン（インスタンス）

- `git clone` で作成
- 顧客専用の `.env`
- 顧客専用のデータベース
- 顧客専用のカスタマイズ
- マスターの改善を `git pull` で取り込み

### 重要なポイント

1. **Git Clone を使う** - ZIP ダウンロードより圧倒的に便利
2. **npm install が必要** - `node_modules` はコピーしない
3. **環境変数は顧客ごとに独立** - セキュリティの要
4. **マスターの改善を簡単に反映** - `git pull` だけ

この方法が、複数顧客へのアプリ提供における**業界標準のベストプラクティス**です。
