# 日報管理システム

社員の日報を管理するWebアプリケーションです。JWT認証による安全なユーザー管理と、管理者による権限管理機能を備えています。

## 主な機能

### 一般ユーザー機能
- ユーザー登録・ログイン（社員番号・パスワード・社員名）
- 日報の作成・編集・削除・閲覧
- 本日の目標設定
- 動的な活動セクション（プロジェクト別に活動内容を記録）
  - プロジェクト/カテゴリー
  - 活動内容
  - 稼働時間（開始時刻・終了時刻から自動計算）
  - 課題
- 改善点・気づきの記録
- 嬉しかったこと・感動したことの記録
- これからのタスクの記録
- 日報詳細ページからの直接編集機能

### 管理者機能
- 管理者専用ログイン画面（`/admin/login`）
- 全社員の日報閲覧
- 社員・日付によるフィルタリング
- 社員管理（権限の付与・変更）
- 操作ログの閲覧（すべての管理者操作を記録）
- ダッシュボード（統計情報表示）

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL (Supabase)
- **ORM**: Prisma 7
- **認証**: JWT (JSON Web Token)
- **デプロイ**: Vercel

## セットアップ

### 1. 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
# データベース接続（Supabase）
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# JWT認証設定（本番環境では必ず変更！）
JWT_SECRET="your-very-secret-jwt-key-change-this-in-production-min-32-chars"

# Supabase設定（オプション）
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. 依存パッケージのインストール

```bash
npm install
# または
yarn install
# または
pnpm install
# または
bun install
```

### 3. データベースのセットアップ

#### Prismaクライアントの生成
```bash
npx prisma generate
```

#### データベースマイグレーションの実行

`MIGRATION.md`を参照して、SupabaseのSQLエディタで以下の順番でSQLを実行してください：

1. Usersテーブルの作成
2. Activitiesテーブルの作成
3. AdminLogテーブルの作成
4. DailyReportsテーブルの更新

#### 初回管理者の作成

最初の管理者は、SupabaseのSQLエディタで直接作成します：

```sql
-- パスワードをハッシュ化（例: "password123"）
-- bcryptでハッシュ化したパスワードを使用してください

INSERT INTO users (employee_number, employee_name, password_hash, role)
VALUES (
  'ADMIN001',
  '管理者',
  '$2a$10$YourHashedPasswordHere',
  'ADMIN'
);
```

パスワードのハッシュ化は、Node.jsで以下のように実行できます：

```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your-password', 10);
console.log(hash);
```

### 4. 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
# または
bun dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。

## 使用方法

### 一般ユーザー

1. **サインアップ**: `/signup` で社員番号・社員名・パスワードを入力
2. **ログイン**: `/login` で社員番号・パスワードを入力
3. **日報作成**: ホーム画面の「+」ボタンから新規日報を作成
4. **日報閲覧**: ホーム画面で自分の日報一覧を確認

### 管理者

1. **管理者ログイン**: `/admin/login` で管理者アカウントでログイン
2. **日報閲覧**: 全社員の日報を閲覧・フィルタリング
3. **社員管理**: `/admin/users` で社員の権限を管理
4. **操作ログ**: `/admin/logs` で管理者の操作履歴を確認

### 管理者権限の付与

1. 既存の管理者が `/admin/users` にアクセス
2. 対象社員の「管理者に昇格」ボタンをクリック
3. 確認ダイアログでOKをクリック
4. 操作は自動的にログに記録されます

## プロジェクト構造

```
web/
├── app/                      # Next.js App Router
│   ├── admin/               # 管理画面
│   │   ├── login/          # 管理者ログイン
│   │   ├── users/          # 社員管理
│   │   ├── logs/           # 操作ログ
│   │   └── reports/        # 日報詳細
│   ├── api/                # API Routes
│   │   ├── auth/           # 認証API
│   │   ├── reports/        # 日報API
│   │   └── admin/          # 管理者API
│   ├── login/              # ログイン画面
│   ├── signup/             # サインアップ画面
│   └── reports/            # 日報作成・詳細
├── components/             # Reactコンポーネント
│   ├── AdminRoute.tsx     # 管理者専用ルート保護
│   ├── ProtectedRoute.tsx # 認証済みルート保護
│   ├── Header.tsx         # ヘッダー
│   ├── DailyReportForm.tsx # 日報フォーム
│   └── DailyReportList.tsx # 日報一覧
├── contexts/              # Reactコンテキスト
│   └── AuthContext.tsx    # 認証コンテキスト
├── lib/                   # ユーティリティ
│   ├── auth.ts           # 認証ヘルパー
│   ├── adminLog.ts       # 操作ログヘルパー
│   └── prisma.ts         # Prismaクライアント
├── prisma/               # Prismaスキーマ
│   └── schema.prisma     # データベーススキーマ
├── types/                # TypeScript型定義
│   └── daily-report.ts   # 日報型定義
├── MIGRATION.md          # マイグレーションガイド
└── README.md             # このファイル
```

## データベーススキーマ

### User（ユーザー）
- id: UUID
- employeeNumber: 社員番号（ユニーク）
- employeeName: 社員名
- passwordHash: パスワードハッシュ
- role: 権限（USER / ADMIN）
- createdAt: 作成日時
- updatedAt: 更新日時

### DailyReport（日報）
- id: UUID
- date: 日付
- dailyGoal: 本日の目標
- improvements: 改善点・気づき
- happyMoments: 嬉しかったこと・感動したこと
- futureTasks: これからのタスク
- userId: ユーザーID（外部キー）
- createdAt: 作成日時
- updatedAt: 更新日時

### Activity（活動）
- id: UUID
- reportId: 日報ID（外部キー）
- projectCategory: プロジェクト/カテゴリー
- content: 活動内容
- workingHours: 稼働時間（時間）
- startTime: 開始時刻（HH:mm形式）
- endTime: 終了時刻（HH:mm形式）
- issues: 課題
- order: 表示順
- createdAt: 作成日時
- updatedAt: 更新日時

### AdminLog（管理者操作ログ）
- id: UUID
- adminId: 管理者ID（外部キー）
- actionType: 操作タイプ（LOGIN, LOGOUT, VIEW_REPORT, etc.）
- targetUserId: 対象ユーザーID
- targetReportId: 対象日報ID
- details: 詳細情報
- ipAddress: IPアドレス
- createdAt: 作成日時

## セキュリティ

- パスワードはbcryptでハッシュ化（salt rounds: 10）
- JWTトークンはhttpOnly Cookieに保存
- トークン有効期限: 7日間
- 管理者APIは全てADMIN権限チェック
- 管理者の操作は全てログに記録

## トラブルシューティング

### Prismaクライアント生成エラー

```bash
npx prisma generate
```

### データベース接続エラー

- `.env`ファイルの`DATABASE_URL`が正しいか確認
- Supabaseプロジェクトが起動しているか確認

### 管理者でログインできない

- ユーザーの`role`が`ADMIN`に設定されているか確認
- SQLで確認: `SELECT * FROM users WHERE employee_number = 'ADMIN001';`

## デプロイ

### Vercelへのデプロイ

1. GitHubにプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数を設定（`DATABASE_URL`, `JWT_SECRET`）
4. デプロイ

詳細は[Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)を参照してください。

## ライセンス

このプロジェクトは私的利用のために作成されました。

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
