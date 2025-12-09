# Prisma 7.0.1 マイグレーショントラブルシューティング

## 日付
2025-12-04

## 概要
日報アプリのセットアップ中に、Prisma 7.0.1の新しい要件によりPrismaClientの初期化エラーが発生しました。このドキュメントは、そのトラブルシューティングプロセスと解決方法を記録しています。

## 発生したエラー

### エラー1: PrismaClient Constructor Validation Error
```
Error [PrismaClientConstructorValidationError]: Using engine type "client" requires either "adapter" or "accelerateUrl" to be provided to PrismaClient constructor.
```

**発生タイミング:** ユーザー登録時（POST /api/auth/signup）

**エラーの場所:** `lib/prisma.ts:15`

**HTTPステータス:** 500 Internal Server Error

## 根本原因

Prisma 7.0.1では、PrismaClientの初期化方法が大幅に変更されました。

### Prisma 6以前の方法（動作しない）
```typescript
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// lib/prisma.ts
export const prisma = new PrismaClient({
  log: ['error', 'warn']
})
```

### Prisma 7の新要件
1. **設定ファイルの分離**: データベース接続URLを`prisma.config.ts`で管理
2. **アダプターの必須化**: 直接データベース接続する場合、専用アダプターが必要
3. **schema.prismaからのURL削除**: `url`プロパティは`schema.prisma`ではサポートされなくなった

## 解決手順

### ステップ1: schema.prismaの修正

**変更前:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**変更後:**
```prisma
datasource db {
  provider = "postgresql"
}
```

`url`プロパティを削除（Prisma 7ではエラーになる）

### ステップ2: 必要なパッケージのインストール

```bash
npm install @prisma/adapter-pg pg
```

**インストールされるパッケージ:**
- `@prisma/adapter-pg`: Prisma用PostgreSQLアダプター
- `pg`: Node.js用PostgreSQLクライアント（node-postgres）

### ステップ3: lib/prisma.tsの修正

**変更前:**
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

**変更後:**
```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// PostgreSQL接続プールの作成
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Prisma PostgreSQLアダプターの作成
const adapter = new PrismaPg(pool)

// PrismaClientのインスタンスを作成（アダプターを渡す）
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

**重要な変更点:**
1. `PrismaPg`と`Pool`のインポート追加
2. PostgreSQL接続プールの作成
3. `PrismaPg`アダプターのインスタンス化
4. `PrismaClient`コンストラクタに`adapter`パラメータを渡す

### ステップ4: Prismaクライアントの再生成

```bash
npx prisma generate
```

### ステップ5: 開発サーバーの再起動

```bash
rm -rf .next
npm run dev
```

## 確認済みの動作環境

- **Prisma CLI**: 7.0.1
- **@prisma/client**: 7.0.1
- **@prisma/adapter-pg**: 7.0.1
- **pg**: 8.13.1
- **Node.js**: v18以上推奨
- **Next.js**: 16.0.6
- **データベース**: PostgreSQL (Supabase)

## prisma.config.tsの役割

Prisma 7では、`prisma.config.ts`がマイグレーション時のデータベース接続を管理します。

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

**重要:** このファイルは**マイグレーション実行時**に使用されます。ランタイムのデータベース接続は`lib/prisma.ts`で`adapter`を通じて管理されます。

## Prisma 7の主な変更点まとめ

### 1. 設定の分離
- **マイグレーション設定**: `prisma.config.ts`
- **ランタイム接続**: `lib/prisma.ts`（アダプター経由）
- **スキーマ定義**: `schema.prisma`（URLなし）

### 2. アダプターパターンの導入
- 直接データベース接続にはアダプターが必須
- データベースごとに専用アダプターを使用
  - PostgreSQL: `@prisma/adapter-pg`
  - MySQL: `@prisma/adapter-mysql`
  - etc.

### 3. 接続プールの明示的管理
- アダプターに接続プール（`Pool`）を渡す
- 接続プールのライフサイクルを自分で管理可能

## トラブルシューティングのヒント

### エラー: "url is no longer supported"
```
error: The datasource property `url` is no longer supported in schema files.
```

**解決策:** `schema.prisma`から`url`行を削除してください。

### エラー: "requires either 'adapter' or 'accelerateUrl'"
```
Using engine type "client" requires either "adapter" or "accelerateUrl"
```

**解決策:**
1. 必要なアダプターパッケージをインストール
2. `lib/prisma.ts`でアダプターを設定
3. `PrismaClient`コンストラクタに`adapter`を渡す

### エラー: Module not found: @prisma/adapter-pg
```
Module not found: Can't resolve '@prisma/adapter-pg'
```

**解決策:**
```bash
npm install @prisma/adapter-pg pg
```

### サーバー再起動後もエラーが続く場合
```bash
# ビルドキャッシュをクリア
rm -rf .next

# Prismaクライアントを再生成
npx prisma generate

# node_modulesを再インストール（最終手段）
rm -rf node_modules package-lock.json
npm install
```

## 参考リンク

- [Prisma 7 Migration Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Prisma Database Adapters](https://www.prisma.io/docs/orm/overview/databases/database-adapters)
- [Prisma Config File](https://pris.ly/d/config-datasource)
- [@prisma/adapter-pg Documentation](https://www.prisma.io/docs/orm/overview/databases/postgresql)

## 学んだこと

1. **メジャーバージョンアップグレードには注意が必要**: Prisma 6→7は破壊的変更を含む
2. **公式ドキュメントの確認**: エラーメッセージに記載されているリンクを確認する
3. **段階的なトラブルシューティング**:
   - エラーメッセージを正確に読む
   - スキーマファイルの検証
   - 依存関係の確認
   - クライアントの再生成
4. **環境変数の管理**: `prisma.config.ts`と`lib/prisma.ts`で役割が異なる

## 今後の対策

1. **バージョン固定**: package.jsonでPrismaのバージョンを固定して予期しないアップグレードを防ぐ
2. **ドキュメント整備**: 新しいプロジェクトメンバー向けにPrisma 7のセットアップ手順を明記
3. **CI/CD確認**: デプロイ環境でも同じバージョンのPrismaが使用されることを確認
4. **定期的な更新**: Prismaの更新情報をチェックし、計画的にアップグレード

## 関連ファイル

- `web/prisma/schema.prisma`: データベーススキーマ定義
- `web/prisma.config.ts`: Prismaマイグレーション設定
- `web/lib/prisma.ts`: PrismaClientインスタンス管理
- `web/.env`: 環境変数（DATABASE_URL含む）
- `web/package.json`: 依存関係バージョン管理
