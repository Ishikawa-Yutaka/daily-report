# マルチテナント化実装ガイド

## 目次

1. [マルチテナントとは](#マルチテナントとは)
2. [なぜマルチテナント化が必要か](#なぜマルチテナント化が必要か)
3. [URL方式の比較](#url方式の比較)
4. [データベース分離方式の比較](#データベース分離方式の比較)
5. [データベース設計](#データベース設計)
6. [実装ステップ](#実装ステップ)
7. [料金プランの実装](#料金プランの実装)
8. [セキュリティ考慮事項](#セキュリティ考慮事項)
9. [実装の優先順位](#実装の優先順位)

---

## マルチテナントとは

**マルチテナント（Multi-Tenancy）** とは、1つのアプリケーション・インフラで複数の顧客（テナント）にサービスを提供するアーキテクチャのことです。

### 具体例

- **Notion**: 各会社が `company-a.notion.so` のような独自URLを持つ
- **Slack**: 各ワークスペースが `company-a.slack.com` で分離
- **Shopify**: 各店舗が `store-name.myshopify.com` で運営

### 現在のアプリの状態

```
現在: 1つのデータベース = 1つの会社
問題: 新しい会社が使いたい場合、手動でデータベースをセットアップする必要がある
```

### マルチテナント化後

```
1つのデータベース = 複数の会社（各会社のデータは完全に分離）
利点: ユーザーが自分でサインアップして即座に使い始められる
```

---

## なぜマルチテナント化が必要か

### 1. **スケーラビリティ**

**現在の問題:**
- 新しい会社ごとに手動でセットアップが必要
- データベースやアプリの管理が煩雑

**マルチテナント化後:**
- ユーザーが自分でサインアップ
- 自動的に新しい組織（テナント）が作成される
- 運営側の手間がゼロ

### 2. **ビジネスモデル**

**現在:**
- 対面営業 → 導入支援 → 1社ずつ契約
- スケールしにくい

**マルチテナント化後:**
- セルフサービス型SaaS
- 無料試用期間 → 自動課金
- スケールしやすい

### 3. **コスト削減**

**1社1データベース方式:**
- Supabase: 1社あたり $25/月（Pro）× 会社数
- 管理コスト大

**マルチテナント方式:**
- Supabase: 1つのデータベースで全社対応
- 会社数が増えても追加コストなし（一定規模まで）

---

## URL方式の比較

### オプションA: サブドメイン方式

**URL例:**
```
https://company-a.yourdomain.com
https://company-b.yourdomain.com
```

**長所:**
- ✅ プロフェッショナルな見た目（Notion、Slackと同じ）
- ✅ ブックマークしやすい
- ✅ セキュリティが明確（URLで会社が識別可能）
- ✅ Cookie分離（セキュリティ向上）
- ✅ 複数の会社を同時に開ける

**短所:**
- ❌ DNS設定が複雑（ワイルドカードDNS必要）
- ❌ SSL証明書の管理（ワイルドカード証明書）
- ❌ Vercel Pro推奨（$20/月）
- ❌ モバイルアプリでの実装が複雑

**実装難易度:** ⭐⭐⭐⭐
**コスト:** Vercel Pro ($20/月)
**適用場面:** ビジネスが軌道に乗った後、プロフェッショナルなイメージが必要

---

### オプションB: パス方式（推奨開始点）

**URL例:**
```
https://yourdomain.com/org/company-a
https://yourdomain.com/org/company-b
```

**長所:**
- ✅ 実装が簡単（Next.js動的ルーティング）
- ✅ DNS設定不要
- ✅ SSL証明書が簡単（1つのドメインのみ）
- ✅ Vercel無料プランで可能
- ✅ モバイルアプリとの統合が簡単

**短所:**
- ❌ URLが長くなる（`yourdomain.com/org/company-a/admin/reports`）
- ❌ Cookie共有（同一ドメイン）
- ❌ やや見た目がシンプル

**実装難易度:** ⭐⭐
**コスト:** 無料（Vercel Hobbyプラン）
**適用場面:** 最初のリリース、MVP（最小限の製品）

**実装例:**

```typescript
// app/org/[slug]/page.tsx
export default async function OrgDashboard({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // slugから組織を取得
  const organization = await prisma.organization.findUnique({
    where: { slug },
  })

  // その組織のデータのみ表示
}
```

---

### オプションC: ログイン時に組織選択

**URL例:**
```
https://yourdomain.com （すべて同じ）
```

**長所:**
- ✅ 最もシンプルな実装
- ✅ DNS/SSL設定不要
- ✅ Vercel無料プラン
- ✅ 複数組織の切り替えが簡単（ドロップダウン）

**短所:**
- ❌ ブックマークできない
- ❌ 複数の会社を同時に開けない
- ❌ セキュリティリスク（間違った会社を見る可能性）
- ❌ UXがやや劣る

**実装難易度:** ⭐
**コスト:** 無料
**適用場面:** 社内ツール、限定的なユーザー数

---

## データベース分離方式の比較

マルチテナント化を実装する際、データベースの分離方法は大きく2つのアプローチがあります。

### 方式1: 論理的分離（organization_id方式）【推奨】

**仕組み:**
- 1つのデータベースで全企業のデータを管理
- すべてのテーブルに`organization_id`カラムを追加
- クエリ時に`organization_id`でフィルタリングしてデータを分離

**メリット:**
- ✅ **完全自動化可能** - ユーザーのサインアップだけで新規組織を作成
- ✅ **運営の手間ゼロ** - 新規企業の追加に人手不要
- ✅ **コストが安定** - 企業数が増えてもデータベースコストは変わらない
- ✅ **メンテナンスが簡単** - スキーマ変更は1回実行するだけ
- ✅ **スケールしやすい** - 数百〜数千社まで対応可能

**デメリット:**
- ⚠️ コードでのフィルタリングが必須（バグがあるとデータ漏洩リスク）
- ⚠️ 1社が超大規模になるとパフォーマンス影響の可能性

**コスト例（Supabase）:**
```
10社:   $25/月  (Proプラン1つ)
100社:  $25/月  (同じプラン)
1000社: $50/月  (容量増加に応じてスケール)
```

**セキュリティ対策:**
```sql
-- Row Level Security (RLS) でデータベースレベルで保護
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "組織のデータのみアクセス可能"
  ON daily_reports FOR ALL
  USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
```

**実装例:**
```typescript
// 新規組織作成 - 完全自動
const organization = await prisma.organization.create({
  data: {
    name: companyName,
    slug: companySlug,
    plan: 'trial',
  },
})

// データ取得時は常にorganization_idでフィルタ
const reports = await prisma.dailyReport.findMany({
  where: {
    organizationId: user.organizationId,  // ← 必須
  },
})
```

**適用場面:**
- 一般的なSaaS（Notion、Slack、Asanaなど大多数のサービス）
- 中小企業〜大企業向けサービス
- スタートアップのMVP

---

### 方式2: 物理的分離（企業ごとに別データベース）

**仕組み:**
- 企業ごとに完全に別のデータベース（別のSupabaseプロジェクト）を作成
- 各企業が独自のデータベースURLとAPIキーを持つ

#### アプローチA: Supabase Management APIで自動化

**Supabase Management API** を使えば、プログラムから新しいデータベースを自動作成できます。

**実装例:**
```typescript
async function createNewDatabase(companyName: string) {
  // Supabase Management APIで新規プロジェクト作成
  const response = await fetch('https://api.supabase.com/v1/projects', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organization_id: process.env.SUPABASE_ORG_ID,
      name: companyName,
      region: 'ap-northeast-1', // 東京
      plan: 'free', // または 'pro'
    }),
  })

  const project = await response.json()

  // スキーマ初期化（MIGRATION.mdのSQLをすべて実行）
  await initializeDatabase(project.database_url)

  // 接続情報を保存
  await saveProjectConfig({
    companyName,
    databaseUrl: project.database_url,
    apiUrl: project.api_url,
    anonKey: project.anon_key,
  })

  return project
}
```

**メリット:**
- ✅ **完全なデータ分離** - 物理的に別のデータベース
- ✅ **パフォーマンス独立** - 1社の負荷が他社に影響しない
- ✅ **カスタマイズ可能** - 企業ごとに異なるスキーマも可能

**デメリット:**
- ❌ **コストが膨大** - 企業数 × $25/月（Supabase Pro）
- ❌ **管理が複雑** - 数百のプロジェクトを管理する必要
- ❌ **スキーマ更新が困難** - 全プロジェクトでSQLを実行する必要
- ❌ **無料枠の制限** - Supabase無料プランは2プロジェクトまで
- ❌ **実装が複雑** - Management APIの設定、エラー処理が必要

**コスト例（Supabase）:**
```
10社:   $250/月   (10プロジェクト × $25)
100社:  $2,500/月  (100プロジェクト × $25)
1000社: $25,000/月 (1000プロジェクト × $25)
```

**スキーマ更新の課題:**
```typescript
// 全企業のデータベースに対してスキーマ変更を実行
for (const company of companies) {
  try {
    await executeSQL(company.databaseUrl, `
      ALTER TABLE daily_reports ADD COLUMN new_field VARCHAR(100);
    `)
  } catch (error) {
    // エラー処理とリトライ、ロールバックが必要
    console.error(`Failed for ${company.name}:`, error)
  }
}
```

**適用場面:**
- 超大企業向け（数万〜数十万ユーザー/社）
- 法的要件で物理的分離が必須（金融、医療など）
- 企業ごとに大幅なカスタマイズが必要

---

#### アプローチB: 手動でデータベース作成

**運営側の作業:**
1. 新規顧客から連絡を受ける
2. Supabaseで新規プロジェクト作成
3. MIGRATION.mdのSQLをすべて実行
4. 環境変数を設定
5. デプロイ
6. 顧客にURL・アカウント情報を提供

**メリット:**
- ✅ 完全なコントロール

**デメリット:**
- ❌ **運営の手間が非常に大きい** - 1社あたり30分〜1時間
- ❌ **スケールしない** - 10社を超えると管理不可能
- ❌ **顧客体験が悪い** - すぐに使い始められない

**適用場面:**
- エンタープライズ専門（年間数社のみ）
- オンプレミス導入が必要なケース

---

### コスト比較表

| 企業数 | 論理的分離（organization_id） | 物理的分離（別DB） | 手間の差 |
|--------|------------------------------|-------------------|----------|
| 1社    | $0（無料枠）                  | $0（無料枠）       | 同じ     |
| 3社    | $0（無料枠）                  | $50/月            | 自動 vs 手動 |
| 10社   | $25/月                       | $250/月           | 自動 vs 大変 |
| 100社  | $25〜50/月                   | $2,500/月         | 自動 vs 不可能 |
| 1000社 | $50〜100/月                  | $25,000/月        | 自動 vs 不可能 |

---

### セキュリティの実際

**「論理的分離は安全なのか？」**

はい、以下の対策を実装すれば**物理的分離と同等のセキュリティ**を実現できます：

#### 1. Row Level Security (RLS)

Supabaseの機能を使い、**データベースレベル**でアクセス制御：

```sql
-- すべてのテーブルでRLSを有効化
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- ポリシー: 自分の組織のデータのみアクセス可能
CREATE POLICY "organization_isolation"
  ON daily_reports FOR ALL
  USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );
```

**利点:** コードにバグがあっても、データベースが保護する

#### 2. アプリケーションレベルの防御

```typescript
// すべてのクエリに organization_id を強制
async function getReports(userId: string) {
  const user = await getUser(userId)

  // 必ず organization_id でフィルタ
  return await prisma.dailyReport.findMany({
    where: {
      organizationId: user.organizationId,  // ← 必須
    },
  })
}

// Prisma ミドルウェアでグローバルに適用
prisma.$use(async (params, next) => {
  if (params.model && currentOrganizationId) {
    params.args.where = {
      ...params.args.where,
      organizationId: currentOrganizationId,
    }
  }
  return next(params)
})
```

#### 3. 監査ログ

```typescript
// すべてのデータアクセスをログに記録
await prisma.auditLog.create({
  data: {
    userId: user.id,
    organizationId: user.organizationId,
    action: 'READ',
    resource: 'daily_reports',
    timestamp: new Date(),
  },
})
```

**実績:** Notion、Slack、Shopify、Stripeなど、**数十億ドル規模の企業**が論理的分離を採用しています。

---

### どちらを選ぶべきか？

#### **99%のケースで「論理的分離（organization_id方式）」を推奨**

**理由:**
1. **コストが100分の1** - 100社で$50/月 vs $2,500/月
2. **運営の手間ゼロ** - 完全自動化
3. **スケールする** - 1000社でも問題なし
4. **セキュリティ十分** - RLSで保護
5. **メンテナンス簡単** - スキーマ変更は1回だけ

#### **物理的分離が必要なのは以下のケースのみ:**

1. **法的要件**
   - 金融機関（銀行法など）
   - 医療機関（HIPAA、個人情報保護法）
   - 政府機関（セキュリティクリアランス）

2. **超大規模顧客**
   - 1社で10万ユーザー以上
   - 1社でテラバイト級のデータ

3. **大幅なカスタマイズ**
   - 企業ごとに全く異なる機能
   - 企業ごとに異なるスキーマ

**日報アプリの場合:**
- 中小企業〜大企業向け
- 法的要件なし
- 標準機能で十分

→ **organization_id方式（論理的分離）が最適**

---

## データベース設計

### 新規テーブル: Organizations

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,           -- 会社名（例: 株式会社ABC）
  slug VARCHAR(50) UNIQUE NOT NULL,     -- URL用（例: abc-corp）
  plan VARCHAR(20) DEFAULT 'trial',     -- trial, paid, canceled
  trial_ends_at TIMESTAMPTZ,            -- 試用期間終了日
  subscription_id VARCHAR(255),         -- Stripe subscription ID
  subscription_status VARCHAR(50),      -- active, past_due, canceled
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_plan ON organizations(plan);
```

### 既存テーブルの変更

**すべてのテーブルに `organization_id` を追加:**

```sql
-- Users
ALTER TABLE users
  ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
CREATE INDEX idx_users_organization ON users(organization_id);

-- Daily Reports
ALTER TABLE daily_reports
  ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
CREATE INDEX idx_reports_organization ON daily_reports(organization_id);

-- Activities
ALTER TABLE activities
  ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
CREATE INDEX idx_activities_organization ON activities(organization_id);

-- Invitation Codes
ALTER TABLE invitation_codes
  ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
CREATE INDEX idx_invitation_codes_organization ON invitation_codes(organization_id);

-- Admin Logs
ALTER TABLE admin_logs
  ADD COLUMN organization_id UUID NOT NULL REFERENCES organizations(id);
CREATE INDEX idx_admin_logs_organization ON admin_logs(organization_id);
```

### Prisma Schema の変更

```prisma
model Organization {
  id                 String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  name               String    @db.VarChar(100)
  slug               String    @unique @db.VarChar(50)
  plan               String    @default("trial") @db.VarChar(20)
  trialEndsAt        DateTime? @map("trial_ends_at") @db.Timestamptz(6)
  subscriptionId     String?   @map("subscription_id") @db.VarChar(255)
  subscriptionStatus String?   @map("subscription_status") @db.VarChar(50)
  createdAt          DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt          DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  users            User[]
  dailyReports     DailyReport[]
  invitationCodes  InvitationCode[]
  adminLogs        AdminLog[]

  @@index([slug], map: "idx_organizations_slug")
  @@index([plan], map: "idx_organizations_plan")
  @@map("organizations")
}

model User {
  id             String       @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  employeeNumber String       @unique @map("employee_number") @db.VarChar(50)
  employeeName   String       @map("employee_name") @db.VarChar(100)
  passwordHash   String       @map("password_hash") @db.VarChar(255)
  role           Role         @default(USER)
  isSuperAdmin   Boolean      @default(false) @map("is_super_admin")
  organizationId String       @map("organization_id") @db.Uuid  // 追加
  createdAt      DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)

  organization   Organization @relation(fields: [organizationId], references: [id])  // 追加
  reports        DailyReport[]
  adminLogs      AdminLog[]

  @@index([organizationId], map: "idx_users_organization")  // 追加
  @@map("users")
}

// 他のモデルも同様にorganizationIdを追加
```

---

## 実装ステップ

### Phase 1: データベース基盤構築

**1. Organizationテーブルを作成**

```sql
-- MIGRATION.md v6として記録
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  plan VARCHAR(20) DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  subscription_id VARCHAR(255),
  subscription_status VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_plan ON organizations(plan);
```

**2. 既存データの移行**

```sql
-- 既存のデータを「デフォルト組織」に移行
INSERT INTO organizations (name, slug, plan)
VALUES ('デフォルト組織', 'default', 'paid')
RETURNING id;

-- 既存のusersテーブルにorganization_idカラムを追加（nullable）
ALTER TABLE users ADD COLUMN organization_id UUID;

-- 既存のユーザーをデフォルト組織に紐付け
UPDATE users
SET organization_id = (SELECT id FROM organizations WHERE slug = 'default');

-- NOT NULL制約を追加
ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_organization
  FOREIGN KEY (organization_id) REFERENCES organizations(id);
```

**3. Prisma Schemaを更新**

```bash
npx prisma db pull        # データベースから最新のスキーマを取得
npx prisma generate       # Prismaクライアントを再生成
```

---

### Phase 2: セルフサインアップフロー

**1. 新規組織登録ページ作成**

`app/signup/new-organization/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewOrganizationPage() {
  const [companyName, setCompanyName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('/api/organizations/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName,
        adminName,
        employeeNumber,
        password,
      }),
    })

    if (res.ok) {
      const { slug } = await res.json()
      // 新しい組織のダッシュボードにリダイレクト
      router.push(`/org/${slug}`)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>新しい会社として登録</h1>
      <input
        type="text"
        placeholder="会社名"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="管理者名"
        value={adminName}
        onChange={(e) => setAdminName(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="社員番号"
        value={employeeNumber}
        onChange={(e) => setEmployeeNumber(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">登録</button>
    </form>
  )
}
```

**2. 組織作成API**

`app/api/organizations/create/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: Request) {
  const { companyName, adminName, employeeNumber, password } = await request.json()

  // 会社名からslugを生成（URLに使用）
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // slugの重複チェック
  const existingOrg = await prisma.organization.findUnique({
    where: { slug },
  })

  if (existingOrg) {
    return NextResponse.json(
      { error: 'この会社名は既に使用されています' },
      { status: 409 }
    )
  }

  // トランザクションで組織とスーパーアドミンを作成
  const result = await prisma.$transaction(async (tx) => {
    // 1. 組織を作成
    const organization = await tx.organization.create({
      data: {
        name: companyName,
        slug,
        plan: 'trial',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
      },
    })

    // 2. スーパーアドミンを作成
    const passwordHash = await hashPassword(password)
    const admin = await tx.user.create({
      data: {
        employeeNumber,
        employeeName: adminName,
        passwordHash,
        role: 'ADMIN',
        isSuperAdmin: true,
        organizationId: organization.id,
      },
    })

    return { organization, admin }
  })

  return NextResponse.json({
    slug: result.organization.slug,
    message: '組織が作成されました'
  })
}
```

**3. すべてのクエリにorganization_idフィルタを追加**

例: 日報取得API

```typescript
// 修正前
const reports = await prisma.dailyReport.findMany({
  where: { userId },
})

// 修正後
const reports = await prisma.dailyReport.findMany({
  where: {
    userId,
    organizationId: user.organizationId,  // 追加
  },
})
```

---

### Phase 3: URL対応（パス方式）

**1. 動的ルーティングの実装**

ファイル構造:
```
app/
├── org/
│   └── [slug]/
│       ├── page.tsx              # ダッシュボード
│       ├── admin/
│       │   ├── page.tsx          # 管理者ダッシュボード
│       │   ├── users/page.tsx
│       │   └── ...
│       └── reports/
│           ├── page.tsx
│           └── [id]/page.tsx
```

**2. 組織コンテキストの作成**

`contexts/OrganizationContext.tsx`:

```typescript
'use client'

import { createContext, useContext, ReactNode } from 'react'

interface Organization {
  id: string
  name: string
  slug: string
  plan: string
}

const OrganizationContext = createContext<Organization | null>(null)

export function OrganizationProvider({
  organization,
  children,
}: {
  organization: Organization
  children: ReactNode
}) {
  return (
    <OrganizationContext.Provider value={organization}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider')
  }
  return context
}
```

**3. レイアウトで組織を読み込む**

`app/org/[slug]/layout.tsx`:

```typescript
import { OrganizationProvider } from '@/contexts/OrganizationContext'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function OrgLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>
  children: ReactNode
}) {
  const { slug } = await params

  const organization = await prisma.organization.findUnique({
    where: { slug },
  })

  if (!organization) {
    notFound()
  }

  return (
    <OrganizationProvider organization={organization}>
      {children}
    </OrganizationProvider>
  )
}
```

---

## 料金プランの実装

### 1. Stripeの統合

**Stripeアカウント作成:**
1. https://stripe.com/jp にアクセス
2. アカウント作成（無料）
3. APIキーを取得

**環境変数:**
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Stripeライブラリのインストール:**
```bash
npm install stripe @stripe/stripe-js
```

### 2. 料金プラン作成

Stripeダッシュボードで商品を作成:
- 商品名: 日報アプリ 月額プラン
- 価格: ¥5,000/月
- 請求サイクル: 毎月

### 3. Checkout セッション作成

`app/api/billing/create-checkout-session/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  })

  if (!organization) {
    return NextResponse.json({ error: '組織が見つかりません' }, { status: 404 })
  }

  // Stripe Checkoutセッションを作成
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: 'price_xxxxxxxxxxxxx', // Stripeで作成した価格ID
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/org/${organization.slug}/billing/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/org/${organization.slug}/billing`,
    metadata: {
      organizationId: organization.id,
    },
  })

  return NextResponse.json({ sessionId: session.id })
}
```

### 4. Webhookで支払いを処理

`app/api/webhooks/stripe/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  // イベント処理
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session

      // 組織のプランを有料に更新
      await prisma.organization.update({
        where: { id: session.metadata?.organizationId },
        data: {
          plan: 'paid',
          subscriptionId: session.subscription as string,
          subscriptionStatus: 'active',
        },
      })
      break

    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription

      // サブスクリプションがキャンセルされた
      await prisma.organization.update({
        where: { subscriptionId: subscription.id },
        data: {
          plan: 'canceled',
          subscriptionStatus: 'canceled',
        },
      })
      break
  }

  return NextResponse.json({ received: true })
}
```

### 5. 試用期間チェックミドルウェア

`middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // /org/[slug]/* へのアクセスをチェック
  if (path.startsWith('/org/')) {
    const slug = path.split('/')[2]

    // 組織情報を取得（APIコール）
    const orgRes = await fetch(`${request.nextUrl.origin}/api/organizations/${slug}`)
    if (!orgRes.ok) {
      return NextResponse.redirect(new URL('/404', request.url))
    }

    const organization = await orgRes.json()

    // 試用期間が終了していて、有料プランでない場合
    if (
      organization.plan === 'trial' &&
      new Date() > new Date(organization.trialEndsAt)
    ) {
      // 請求ページ以外はブロック
      if (!path.includes('/billing')) {
        return NextResponse.redirect(
          new URL(`/org/${slug}/billing/upgrade`, request.url)
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/org/:path*',
}
```

---

## セキュリティ考慮事項

### 1. データ漏洩の防止

**すべてのクエリにorganization_idを含める:**

```typescript
// ❌ 危険: 他の組織のデータも取得できてしまう
const reports = await prisma.dailyReport.findMany({
  where: { userId },
})

// ✅ 安全: 自分の組織のデータのみ
const reports = await prisma.dailyReport.findMany({
  where: {
    userId,
    organizationId: user.organizationId,
  },
})
```

**グローバルフィルターの実装（推奨）:**

Prismaミドルウェアでグローバルに organization_id をフィルタ:

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  const client = new PrismaClient()

  // ミドルウェアでorganizationIdを自動追加
  client.$use(async (params, next) => {
    // organization_idが設定されている場合のみ
    const orgId = (global as any).currentOrganizationId

    if (orgId && params.model) {
      // SELECT, UPDATE, DELETE クエリにorganizationIdを追加
      if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
        params.args.where = {
          ...params.args.where,
          organizationId: orgId,
        }
      }
    }

    return next(params)
  })

  return client
}
```

### 2. Row Level Security (RLS) - Supabase

Supabaseを使っている場合、データベースレベルでセキュリティを強化:

```sql
-- RLSを有効化
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分の組織のデータのみアクセス可能
CREATE POLICY "Users can only access their organization's reports"
  ON daily_reports
  FOR ALL
  USING (
    organization_id = (
      SELECT organization_id
      FROM users
      WHERE id = auth.uid()
    )
  );
```

### 3. 組織間のユーザー移動

**問題:** ユーザーが複数の組織に所属する場合

**解決策1: 1ユーザー = 1組織（シンプル）**
- メールアドレスが同じでも、組織ごとに別アカウント
- セキュリティが高い

**解決策2: Many-to-Many（複雑）**
- `OrganizationMember` テーブルを追加
- 1ユーザーが複数組織に所属可能
- 実装が複雑

---

## 実装の優先順位

### **今すぐ（現在のアプリを完成させる）**

1. ✅ 招待コードシステムの完成（既に実装済み）
2. ⬜ 日報機能の完成・テスト
3. ⬜ モバイルアプリの完成
4. ⬜ UI/UXの改善

**タイムライン:** 1-2週間

---

### **次のステップ（マルチテナント化）**

**Phase 1: データベース基盤（1週間）**
1. Organizationモデルの追加
2. 既存データの移行（デフォルト組織）
3. すべてのクエリにorganization_idフィルタ追加
4. テスト

**Phase 2: セルフサインアップ（1週間）**
1. 新規組織登録フロー
2. 組織作成API
3. 招待コードの組織単位化
4. テスト

**Phase 3: URL対応（1週間）**
1. パス方式の実装（`/org/[slug]`）
2. 組織コンテキストの実装
3. リンクの修正（全ページ）
4. テスト

**タイムライン:** 3-4週間

---

### **最後（収益化）（2-3週間）**

**Phase 1: Stripe統合**
1. Stripeアカウント作成
2. Checkout セッション実装
3. Webhook実装
4. テスト（テストモード）

**Phase 2: 試用期間管理**
1. 試用期間チェックミドルウェア
2. アップグレードページ
3. 請求履歴ページ

**Phase 3: 本番リリース**
1. Stripeを本番モードに切り替え
2. 価格設定の最終決定
3. 利用規約・プライバシーポリシー
4. リリース

**タイムライン:** 2-3週間

---

## まとめ

### マルチテナント化の重要ポイント

1. **段階的に実装する**
   - 一度にすべて変更しない
   - Phase 1 → Phase 2 → Phase 3 の順で

2. **セキュリティを最優先**
   - すべてのクエリに`organization_id`
   - Row Level Security（RLS）の活用

3. **URL方式は後から変更可能**
   - 最初はパス方式で実装
   - 成長後にサブドメイン方式に移行も可能

4. **料金プランは後回しでOK**
   - マルチテナント化が先
   - Stripe統合は最後でも問題なし

### 推奨実装順序

```
1. 現在のアプリを完成させる（1-2週間）
   ↓
2. マルチテナント化（3-4週間）
   - データベース基盤
   - セルフサインアップ
   - URL対応
   ↓
3. 収益化（2-3週間）
   - Stripe統合
   - 試用期間管理
   - 本番リリース
```

合計: **6-9週間**で完成

---

## 参考リンク

- [Prisma: Multi-tenancy](https://www.prisma.io/docs/guides/database/multi-tenancy)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Stripe: Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Next.js: Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Vercel: Wildcard Domains](https://vercel.com/docs/concepts/projects/domains/wildcard-domains)

---

**作成日:** 2025-12-22
**対象アプリ:** 日報管理システム
**目的:** マルチテナント化の学習と実装ガイド
