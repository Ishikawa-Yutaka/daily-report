# データベースマイグレーションガイド

このドキュメントは、データベーススキーマの移行手順を説明します。

## 変更概要

### v1 → v2の主な変更点

1. **Userテーブルの追加**: JWT認証機能のための社員情報管理
2. **Activityテーブルの追加**: 活動セクションを別テーブルとして管理
3. **DailyReportテーブルの更新**:
   - `userId`カラム追加（User との関連）
   - `quarterlyGoal`カラム追加（3ヶ月間の目標）
   - `activities`カラム削除（Activityテーブルに移行）

### v2 → v3の主な変更点（管理機能追加）

1. **Userテーブルの更新**: `role`カラム追加（USER / ADMIN権限管理）
2. **AdminLogテーブルの追加**: 管理者操作ログの記録
3. **Enumの追加**: UserRole、AdminActionType

## 移行手順

### ステップ1: Usersテーブルの作成

Supabase SQLエディタで以下のSQLを実行してください。

```sql
-- UserRole Enumの作成
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

-- Usersテーブルの作成
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  employee_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'USER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 社員番号のインデックス作成（検索高速化）
CREATE INDEX IF NOT EXISTS idx_users_employee_number ON users(employee_number);

-- roleのインデックス作成（管理者検索高速化）
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- テストユーザーの作成（パスワード: password123）
-- 本番環境では削除してください
INSERT INTO users (employee_number, employee_name, password_hash)
VALUES (
  'EMP001',
  'テストユーザー',
  '$2a$10$YourHashedPasswordHere'
)
ON CONFLICT (employee_number) DO NOTHING;
```

### ステップ2: Activitiesテーブルの作成

```sql
-- Activitiesテーブルの作成
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL,
  project_category VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  working_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  issues TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_activities_report
    FOREIGN KEY (report_id)
    REFERENCES daily_reports(id)
    ON DELETE CASCADE
);

-- レポートIDのインデックス作成（検索高速化）
CREATE INDEX IF NOT EXISTS idx_activities_report_id ON activities(report_id);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();
```

### ステップ3: DailyReportsテーブルの更新

**注意**: 既存のデータがある場合は、バックアップを取ってから実行してください。

```sql
-- 既存のdaily_reportsテーブルにuserIdカラムを追加
-- まず、デフォルトユーザーを作成（既存データ用）
DO $$
DECLARE
  default_user_id UUID;
BEGIN
  -- デフォルトユーザーを作成または取得
  INSERT INTO users (employee_number, employee_name, password_hash)
  VALUES (
    'MIGRATED_USER',
    '移行済みユーザー',
    '$2a$10$defaultHashForMigratedUser'
  )
  ON CONFLICT (employee_number) DO NOTHING
  RETURNING id INTO default_user_id;

  -- default_user_idがNULLの場合は既存ユーザーのIDを取得
  IF default_user_id IS NULL THEN
    SELECT id INTO default_user_id FROM users WHERE employee_number = 'MIGRATED_USER';
  END IF;

  -- userIdカラムを追加（一時的にNULL許可）
  ALTER TABLE daily_reports
  ADD COLUMN IF NOT EXISTS user_id UUID;

  -- 既存レコードにデフォルトユーザーIDを設定
  UPDATE daily_reports
  SET user_id = default_user_id
  WHERE user_id IS NULL;

  -- userIdをNOT NULLに変更
  ALTER TABLE daily_reports
  ALTER COLUMN user_id SET NOT NULL;

  -- 外部キー制約を追加
  ALTER TABLE daily_reports
  ADD CONSTRAINT fk_daily_reports_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;
END $$;

-- userIdのインデックス作成
CREATE INDEX IF NOT EXISTS idx_daily_reports_user_id ON daily_reports(user_id);

-- quarterlyGoalカラムを追加
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS quarterly_goal TEXT;

-- 既存レコードにデフォルト値を設定（必要に応じて）
UPDATE daily_reports
SET quarterly_goal = '目標未設定'
WHERE quarterly_goal IS NULL;
```

### ステップ4: 既存データの移行（activitiesカラムからActivitiesテーブルへ）

既存の`daily_reports.activities`カラムのデータを`activities`テーブルに移行します。

```sql
-- 既存のactivitiesカラムからActivitiesテーブルへデータ移行
-- 注意: この例は単純な移行です。実際のデータ構造に応じて調整が必要です
DO $$
DECLARE
  report_record RECORD;
BEGIN
  -- activitiesカラムが存在する場合のみ実行
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'daily_reports'
    AND column_name = 'activities'
  ) THEN
    -- 各日報レコードに対して
    FOR report_record IN SELECT id, activities FROM daily_reports LOOP
      -- activitiesがNULLでない場合、新しいActivityレコードを作成
      IF report_record.activities IS NOT NULL AND report_record.activities != '' THEN
        INSERT INTO activities (
          report_id,
          project_category,
          content,
          working_hours,
          issues,
          "order"
        ) VALUES (
          report_record.id,
          '移行済みプロジェクト',
          report_record.activities,
          0,
          '',
          0
        );
      END IF;
    END LOOP;

    -- 移行完了後、activitiesカラムを削除
    ALTER TABLE daily_reports DROP COLUMN IF EXISTS activities;
  END IF;
END $$;
```

### ステップ5: 動作確認

移行が正常に完了したか確認します。

```sql
-- Usersテーブルの確認
SELECT * FROM users LIMIT 5;

-- DailyReportsテーブルの確認（userId が設定されているか）
SELECT id, date, user_id, quarterly_goal, created_at
FROM daily_reports
LIMIT 5;

-- Activitiesテーブルの確認
SELECT a.*, dr.date
FROM activities a
JOIN daily_reports dr ON a.report_id = dr.id
LIMIT 10;

-- リレーションの確認（日報とその活動を結合）
SELECT
  dr.id as report_id,
  dr.date,
  u.employee_name,
  a.project_category,
  a.working_hours
FROM daily_reports dr
JOIN users u ON dr.user_id = u.id
LEFT JOIN activities a ON a.report_id = dr.id
ORDER BY dr.date DESC, a."order" ASC
LIMIT 20;
```

## ロールバック手順

移行に問題が発生した場合のロールバック手順です。

```sql
-- ステップ1: 外部キー制約を削除
ALTER TABLE daily_reports DROP CONSTRAINT IF EXISTS fk_daily_reports_user;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS fk_activities_report;

-- ステップ2: 追加したカラムを削除
ALTER TABLE daily_reports DROP COLUMN IF EXISTS user_id;
ALTER TABLE daily_reports DROP COLUMN IF EXISTS quarterly_goal;

-- ステップ3: 新しいテーブルを削除
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS users;

-- ステップ4: トリガーと関数を削除
DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
DROP TRIGGER IF EXISTS trigger_update_activities_updated_at ON activities;
DROP FUNCTION IF EXISTS update_users_updated_at();
DROP FUNCTION IF EXISTS update_activities_updated_at();

-- ステップ5: activitiesカラムを再追加（必要に応じて）
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS activities TEXT;
```

## 注意事項

1. **バックアップ**: 移行前に必ずデータベースのバックアップを取得してください
2. **テスト環境**: 本番環境での実行前に、テスト環境で移行手順を検証してください
3. **ダウンタイム**: 移行中はアプリケーションを一時停止することを推奨します
4. **パスワードハッシュ**: テストユーザーのパスワードは必ず変更してください
5. **データ検証**: 移行後は必ずデータの整合性を確認してください

## Prismaクライアントの再生成

移行完了後、Prismaクライアントを再生成してください。

```bash
cd web
npx prisma generate
```

## トラブルシューティング

### 外部キー制約エラー

既存のdaily_reportsレコードに対応するuserが存在しない場合、エラーが発生します。
ステップ3のDO $$ブロックで自動的にデフォルトユーザーが作成されますが、手動で作成する場合は以下を実行してください。

```sql
INSERT INTO users (employee_number, employee_name, password_hash)
VALUES ('DEFAULT_USER', 'デフォルトユーザー', '$2a$10$...');
```

### 既存データの確認

移行前のデータを確認したい場合:

```sql
-- 既存のdaily_reportsの件数
SELECT COUNT(*) FROM daily_reports;

-- activitiesカラムにデータがあるレコード数
SELECT COUNT(*) FROM daily_reports WHERE activities IS NOT NULL;
```

## v3への移行手順（管理機能追加）

### ステップ6: AdminLogテーブルの作成

管理者の操作ログを記録するテーブルを作成します。

```sql
-- AdminActionType Enumの作成
CREATE TYPE admin_action_type AS ENUM (
  'LOGIN',
  'LOGOUT',
  'VIEW_REPORT',
  'FILTER_REPORTS',
  'CHANGE_USER_ROLE',
  'VIEW_USERS',
  'VIEW_LOGS'
);

-- AdminLogテーブルの作成
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action_type admin_action_type NOT NULL,
  target_user_id UUID,
  target_report_id UUID,
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_admin_logs_admin
    FOREIGN KEY (admin_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- インデックス作成（検索高速化）
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action_type ON admin_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
```

### ステップ7: 初回管理者の作成

最初の管理者を作成します。パスワードは事前にbcryptでハッシュ化してください。

```sql
-- パスワードのハッシュ化方法（Node.jsで実行）:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('your-password', 10);
-- console.log(hash);

-- 管理者ユーザーの作成
INSERT INTO users (employee_number, employee_name, password_hash, role)
VALUES (
  'ADMIN001',
  '管理者',
  '$2a$10$YourHashedPasswordHere',  -- 実際のハッシュ値に置き換えてください
  'ADMIN'
)
ON CONFLICT (employee_number) DO NOTHING;
```

### ステップ8: 既存ユーザーのrole更新（必要な場合）

既にUserテーブルが存在し、roleカラムがない場合は、以下を実行してください。

```sql
-- roleカラムが存在しない場合のみ実行
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'USER';

-- roleのインデックス作成
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 特定のユーザーを管理者に昇格（必要に応じて）
UPDATE users
SET role = 'ADMIN'
WHERE employee_number = 'EMP001';  -- 管理者にしたい社員番号
```

## v3移行後の動作確認

```sql
-- 管理者の確認
SELECT id, employee_number, employee_name, role
FROM users
WHERE role = 'ADMIN';

-- AdminLogテーブルの確認
SELECT * FROM admin_logs LIMIT 5;

-- Enumの確認
SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'user_role'::regtype;

SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'admin_action_type'::regtype;
```

## 移行後のアプリケーション設定

1. `.env`ファイルに`JWT_SECRET`を設定してください
2. アプリケーションを再起動してください
3. 新規ユーザーでサインアップを試してください
4. 日報の作成・編集・削除が正常に動作するか確認してください
5. 管理者アカウントで`/admin/login`にアクセスして管理画面を確認してください
6. 社員管理機能で権限の付与・変更が正常に動作するか確認してください
7. 操作ログが正しく記録されているか確認してください

## サポート

移行中に問題が発生した場合は、エラーメッセージとともにログを確認してください。
