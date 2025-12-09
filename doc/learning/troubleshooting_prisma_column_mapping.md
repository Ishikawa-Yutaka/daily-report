# Prismaカラムマッピングのトラブルシューティング

## 問題の概要

日報アプリで`startTime`と`endTime`フィールドを追加した際、以下のエラーが発生：

```
Unknown argument `startTime`
The column `(not available)` does not exist in the current database.
```

## 原因

データベースのカラム名とPrismaスキーマのフィールド名に不一致があった。

- **データベース**: `start_time`, `end_time` (snake_case)
- **Prismaスキーマ**: `startTime`, `endTime` (camelCase)

Prismaは明示的なマッピングがない場合、フィールド名をそのままカラム名として使用しようとするため、データベースに存在しないカラムを参照してエラーが発生した。

## 解決方法

### 1. Prismaスキーマに`@map()`ディレクティブを追加

`prisma/schema.prisma`のActivityモデルを修正：

```prisma
model Activity {
  id              String      @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  projectCategory String
  content         String
  workingHours    Float       @default(0)
  startTime       String?     @map("start_time")  // 追加
  endTime         String?     @map("end_time")    // 追加
  issues          String
  order           Int         @default(0)
  createdAt       DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt       DateTime    @default(now()) @updatedAt @db.Timestamptz(6)
  reportId        String      @db.Uuid
  report          DailyReport @relation(fields: [reportId], references: [id], onDelete: Cascade, onUpdate: NoAction, map: "fk_activity_report")

  @@index([order], map: "idx_activities_order")
  @@index([reportId], map: "idx_activities_report_id")
  @@map("activities")
}
```

### 2. Prisma Clientの再生成

```bash
cd /Users/Uni/Uni_MacBookAir/アプリ制作/日報アプリ/web
npx prisma generate
```

### 3. Next.jsキャッシュのクリア

```bash
rm -rf .next
```

### 4. 開発サーバーの再起動

```bash
npm run dev
```

## データベースカラムの確認方法

データベースに実際に存在するカラムを確認するSQL：

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'activities'
ORDER BY ordinal_position;
```

## マイグレーションの作成

カラムを追加する際のマイグレーションファイル例：

```sql
-- AlterTable
ALTER TABLE "activities" ADD COLUMN "start_time" VARCHAR,
ADD COLUMN "end_time" VARCHAR;
```

マイグレーションの適用：

```bash
npx prisma migrate deploy
```

## 複数アプリで同じデータベースを共有する場合の注意点

出退勤アプリと日報アプリで同じSupabaseデータベースを使用している場合：

1. **スキーマの同期**: 両方のプロジェクトで同じ`schema.prisma`を使用
2. **マイグレーション管理**: 一方でマイグレーションを作成・適用したら、もう一方にもコピー
3. **Prisma Clientの再生成**: 両方のプロジェクトで`npx prisma generate`を実行

スキーマファイルのコピー：

```bash
cp /Users/Uni/Uni_MacBookAir/アプリ制作/日報アプリ/web/prisma/schema.prisma \
   /Users/Uni/Uni_MacBookAir/アプリ制作/出退勤アプリ/AttendanceDeparture/web/prisma/schema.prisma
```

## トラブルシューティングの手順

1. **データベースのカラム名を確認**
   - SQLで実際のカラム名を確認
   - snake_caseかcamelCaseかをチェック

2. **Prismaスキーマと比較**
   - フィールド名とカラム名が一致しているか
   - `@map()`ディレクティブが必要か判断

3. **修正と再生成**
   - 必要に応じて`@map()`を追加
   - `npx prisma generate`でクライアント再生成

4. **キャッシュクリアと再起動**
   - `.next`ディレクトリを削除
   - `node_modules/.prisma`も必要に応じて削除
   - 開発サーバーを再起動

## よくある落とし穴

1. **Prisma Clientの再生成忘れ**
   - スキーマを変更したら必ず`npx prisma generate`を実行

2. **古いキャッシュの残存**
   - エラーが解決しない場合は`.next`と`node_modules/.prisma`を削除

3. **マイグレーションとスキーマの不一致**
   - マイグレーションでカラムを追加したら、スキーマも更新
   - その逆も同様

4. **複数サーバーの起動**
   - 古いサーバープロセスが残っていると古いPrisma Clientが使われる
   - すべてのサーバーを停止してから再起動

## 参考情報

- [Prisma Schema Reference - @map](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#map)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Naming Conventions](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#naming-conventions)

## 日付

作成日: 2025-12-04
