# ビジネスサイト構築・メール環境 まとめ

## 要件

- ビジネスで顧客とメールでやり取り
- ホームページからのお問い合わせ受信
- 独自ドメインあり（ホームページとメールは同じドメイン）
- スピードと将来の拡張性を重視
- React / Next.js の経験あり
- ブログやお知らせなど頻繁にコンテンツ更新あり

---

## 結論：採用する構成

```
独自ドメイン（example.com）
    │
    ├── Webサイト → Cloudflare Pages + Next.js + microCMS
    │
    └── メール → Google Workspace
    
DNS管理 → Cloudflare
```

---

## Google One と Google Workspace の違い

| サービス | 用途 | メール機能 |
|----------|------|------------|
| **Google One** | ストレージ容量追加（Gmail/Drive/Photos共通） | なし（容量増加のみ） |
| **Google Workspace** | ビジネス向け統合サービス | 独自ドメインメール対応 |

**ビジネスメールには Google Workspace が必要**

---

## ホームページ構成の比較

| 項目 | Xサーバー + WordPress | Cloudflare + Next.js |
|------|----------------------|---------------------|
| **難易度** | 初〜中級 | 中〜上級 |
| **構築スピード** | 速い | やや時間がかかる |
| **カスタマイズ性** | テーマ・プラグイン依存 | 自由自在 |
| **表示速度** | 普通〜速い | 非常に速い |
| **運用コスト** | 月額約1,000円〜 | 無料〜（Pages Free Tier） |
| **メールサーバー** | 付属あり | なし |
| **お問い合わせフォーム** | プラグインで簡単 | 自前実装 or 外部サービス |

**→ スピード・拡張性重視、Next.js経験ありのため Cloudflare + Next.js を選択**

---

## 採用構成の詳細

### ホスティング：Cloudflare Pages

- エッジ配信で高速
- 無料枠が充実
- Git連携で自動デプロイ

### フレームワーク：Next.js

- SSG / ISR 対応で高速
- 拡張性が高い
- React ベースで開発しやすい

### CMS：microCMS（推奨）

| CMS | 特徴 | 無料枠 |
|-----|------|--------|
| **microCMS** | 日本製、日本語UI、サポート充実 | 3API、10,000リクエスト/月 |
| **Newt** | 日本製、シンプル | 3モデル、10,000リクエスト/月 |
| **Contentful** | 海外大手、機能豊富 | 25,000レコード |
| **Notion API** | 普段Notion使ってるなら楽 | 無料 |

### お問い合わせフォーム

| 方法 | 特徴 |
|------|------|
| **Formspree / Getform** | 設置が最も簡単、無料枠あり |
| **Resend + React Email** | 自由度高い、月3,000通無料 |
| **Next.js API Route + Google Workspace SMTP** | 完全自前、コスト最小 |

---

## メール環境

### サービス比較

| サービス | 月額/ユーザー | 特徴 |
|----------|---------------|------|
| **Google Workspace** | ¥680〜 | Gmail UIに慣れてるなら最適、検索が強力 |
| **Microsoft 365** | ¥750〜 | Outlook派向け、Office アプリ付き |
| **Xサーバー付属** | 実質無料 | コスト最小、機能は必要十分 |
| **Zoho Mail** | 無料〜¥120 | コスパ最強、UIがやや独特 |

**→ Google Workspace を選択**

### Google Workspace でできること

- 独自ドメインでメール送受信（info@example.com など）
- 複数アドレス作成（info@、support@、sales@ など）
- PC（Webブラウザ）、スマホアプリから操作
- 迷惑メール自動フィルタ
- 添付ファイル送受信（最大25MB）
- Google カレンダー・ドライブ・Meet との統合

### Google Workspace 料金プラン

| プラン | 月額/ユーザー | 保存容量 |
|--------|---------------|----------|
| Business Starter | ¥680 | 30GB |
| Business Standard | ¥1,360 | 2TB |
| Business Plus | ¥2,040 | 5TB |

---

## DNS設定（Cloudflare）

| タイプ | 名前 | 値 |
|--------|------|-----|
| CNAME | @ | your-site.pages.dev |
| MX | @ | aspmx.l.google.com（優先度1） |
| MX | @ | alt1.aspmx.l.google.com（優先度5） |
| TXT | @ | v=spf1 include:_spf.google.com ~all |

---

## 導入手順

1. **Google Workspace** 契約 → メール設定
2. **Cloudflare** でDNS管理（ドメイン移管 or ネームサーバー変更）
3. **Cloudflare** でMXレコード設定（Google Workspace用）
4. **microCMS** でコンテンツ構造設計
5. **Next.js** でサイト構築
6. **Cloudflare Pages** にデプロイ
7. お問い合わせフォーム実装

---

## 月額コスト概算

| 項目 | 費用 |
|------|------|
| Cloudflare Pages | 無料 |
| microCMS | 無料（無料枠内） |
| Google Workspace | ¥680〜/ユーザー |
| ドメイン | 年額¥1,000〜3,000程度 |

**合計：約¥700〜/月 + ドメイン代**
