# Next.js App Router ファイル命名規則

このドキュメントでは、Next.js App Routerで使用されるファイル命名規則について説明します。

---

## 1. 予約されたファイル名（特別な役割を持つファイル）

Next.jsが自動的に認識し、特定の機能を提供するファイルです。
これらのファイル名は変更できません。

| ファイル名 | 役割 | 説明 |
|-----------|------|------|
| `page.tsx` | ページ | URLに対応するページコンポーネント。このファイルがあるディレクトリがURLになる |
| `layout.tsx` | レイアウト | 複数のページで共有されるUI。子ページをラップする |
| `loading.tsx` | ローディング | ページ読み込み中に表示されるUI |
| `error.tsx` | エラー | エラー発生時に表示されるUI |
| `not-found.tsx` | 404 | ページが見つからない時に表示されるUI |
| `route.ts` | APIルート | APIエンドポイントを定義するファイル |
| `template.tsx` | テンプレート | layoutと似ているが、ナビゲーション時に再マウントされる |
| `default.tsx` | デフォルト | 並列ルートのデフォルト表示 |
| `global-error.tsx` | グローバルエラー | アプリ全体のエラーハンドリング |
| `middleware.ts` | ミドルウェア | リクエスト処理前に実行される（ルートディレクトリに配置） |

### 例: ディレクトリ構造とURL対応

```
app/
├── page.tsx           → URL: /
├── layout.tsx         → 全ページ共通のレイアウト
├── loading.tsx        → 全ページ共通のローディング
├── dashboard/
│   ├── page.tsx       → URL: /dashboard
│   └── layout.tsx     → /dashboard以下のページ共通レイアウト
└── login/
    └── page.tsx       → URL: /login
```

---

## 2. 慣習的なファイル名（自由だが一般的に使われる名前）

これらは予約されていないため、別の名前でも動作します。
ただし、チーム開発では統一することが推奨されます。

| ファイル名 | 用途 | 説明 |
|-----------|------|------|
| `actions.ts` | Server Actions | フォーム送信やデータ更新処理をまとめる |
| `types.ts` | 型定義 | TypeScriptの型をまとめる |
| `utils.ts` | ユーティリティ | 汎用的な関数をまとめる |
| `constants.ts` | 定数 | 定数値をまとめる |
| `hooks.ts` | カスタムフック | Reactのカスタムフックをまとめる |
| `components.tsx` | コンポーネント | ページ固有のコンポーネントをまとめる |
| `styles.css` | スタイル | ページ固有のスタイル |

### 例: loginディレクトリの構成

```
app/login/
├── page.tsx       → ログインページ（予約ファイル）
├── actions.ts     → ログイン処理（慣習的命名）
├── types.ts       → 型定義（慣習的命名）
└── components.tsx → ログインフォームなど（慣習的命名）
```

---

## 3. 特殊なディレクトリ名

### ルートグループ: `(フォルダ名)`

括弧で囲んだディレクトリはURLに含まれません。
主にレイアウトを共有するために使用します。

```
app/
├── (dashboard)/           → URLには含まれない
│   ├── layout.tsx         → このグループ共通のレイアウト
│   ├── dashboard/
│   │   └── page.tsx       → URL: /dashboard
│   └── settings/
│       └── page.tsx       → URL: /settings
└── (auth)/                → URLには含まれない
    └── login/
        └── page.tsx       → URL: /login
```

### 動的ルート: `[パラメータ名]`

角括弧で囲んだディレクトリは動的なURLパラメータになります。

```
app/
└── users/
    └── [id]/
        └── page.tsx       → URL: /users/123, /users/abc など
```

### プライベートフォルダ: `_フォルダ名`

アンダースコアで始まるディレクトリはルーティングから除外されます。
内部的なコンポーネントやユーティリティを格納するのに使用します。

```
app/
├── _components/           → URLにならない（内部コンポーネント用）
│   └── Button.tsx
└── dashboard/
    └── page.tsx
```

---

## 4. Server Actionsについて

Server Actionsは、サーバー側で実行される関数です。
ファイル名は自由ですが、`"use server"` ディレクティブが必要です。

### 書き方1: ファイル全体をServer Actionにする

```typescript
// actions.ts
"use server";  // ファイルの先頭に記述

export async function login(formData: FormData) {
  // この関数はサーバーで実行される
}

export async function logout() {
  // この関数もサーバーで実行される
}
```

### 書き方2: 関数単位でServer Actionにする

```typescript
// page.tsx
export default function Page() {
  async function handleSubmit(formData: FormData) {
    "use server";  // 関数内に記述
    // この関数はサーバーで実行される
  }

  return <form action={handleSubmit}>...</form>;
}
```

---

## 5. このプロジェクトでの命名規則

このプロジェクトでは以下の命名規則を採用しています。

| ファイル | 命名規則 |
|---------|---------|
| ページ | `page.tsx`（Next.js予約） |
| レイアウト | `layout.tsx`（Next.js予約） |
| Server Actions | `actions.ts` |
| 型定義 | `types.ts` |
| ユーティリティ | `utils.ts` |
| コンポーネント | `components/` ディレクトリに配置 |

---

## 参考リンク

- [Next.js App Router ドキュメント](https://nextjs.org/docs/app)
- [Server Actions ドキュメント](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
