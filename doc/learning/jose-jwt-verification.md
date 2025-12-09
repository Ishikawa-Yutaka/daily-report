# JOSEライブラリとjwtVerifyの使い方

## 日付
2025-12-04

## 概要
Next.js 16のミドルウェアでJWT認証を実装する際に、`jose`ライブラリの`jwtVerify`関数を使用しました。このドキュメントは、JOSEライブラリの基本概念と使い方を記録しています。

## JOSEライブラリとは

### 基本情報
- **名前**: jose (JavaScript Object Signing and Encryption)
- **公式リポジトリ**: https://github.com/panva/jose
- **npm**: https://www.npmjs.com/package/jose
- **目的**: JWT、JWE、JWS、JWKなどのJOSE標準を実装

### 主な特徴
1. **Edge Runtime対応**: Next.js Edge Runtime（ミドルウェア）で動作
2. **TypeScript完全サポート**: 型定義が充実している
3. **セキュア**: 最新のセキュリティベストプラクティスに準拠
4. **軽量**: 依存関係が少ない
5. **標準準拠**: IETF JOSEワーキンググループの仕様に準拠

### Next.jsでの推奨理由
Next.js公式ドキュメントでは、ミドルウェアでのJWT検証に`jose`の使用を推奨しています。理由は以下の通りです:

- Edge Runtimeで動作する（従来の`jsonwebtoken`は非対応）
- 非同期処理に対応
- Web標準APIを使用

## インストール

```bash
npm install jose
```

**インストール後の確認:**
```bash
npm list jose
```

## jwtVerify関数

### 基本的な使い方

```typescript
import { jwtVerify } from 'jose'

// シークレットキーをUint8Arrayに変換
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

// JWTトークンを検証
try {
  const { payload, protectedHeader } = await jwtVerify(token, secret)
  console.log('認証成功:', payload)
} catch (error) {
  console.error('認証失敗:', error)
}
```

### jwtVerifyの返り値

```typescript
interface JWTVerifyResult {
  payload: JWTPayload        // トークンに含まれるデータ
  protectedHeader: JWSHeaderParameters  // JWTヘッダー情報
}

interface JWTPayload {
  iss?: string      // Issuer (発行者)
  sub?: string      // Subject (主体 - 通常はユーザーID)
  aud?: string[]    // Audience (対象者)
  exp?: number      // Expiration Time (有効期限)
  nbf?: number      // Not Before (有効開始時刻)
  iat?: number      // Issued At (発行時刻)
  jti?: string      // JWT ID (トークン識別子)
  [key: string]: any  // カスタムクレーム
}
```

### jwtVerifyが検証すること

1. **署名の検証**
   - トークンが正しいシークレットキーで署名されているか
   - トークンが改ざんされていないか

2. **有効期限の検証**
   - `exp` (expiration) フィールドをチェック
   - 期限切れの場合はエラーをスロー

3. **発行時刻の検証**
   - `nbf` (not before) フィールドをチェック
   - まだ有効でない場合はエラーをスロー

4. **構造の検証**
   - JWTの形式が正しいか（header.payload.signature）

## Next.jsミドルウェアでの実装例

### middleware.ts

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// 認証が不要なパス
const publicPaths = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公開パスの場合、認証チェックをスキップ
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // クッキーからJWTトークンを取得
  const token = request.cookies.get('token')?.value

  // トークンの検証
  let isAuthenticated = false
  if (token) {
    try {
      // シークレットキーをUint8Arrayに変換
      const secret = new TextEncoder().encode(process.env.JWT_SECRET)

      // JWTトークンを検証
      const { payload } = await jwtVerify(token, secret)

      // 検証成功
      isAuthenticated = true

      // 必要に応じてpayloadから情報を取得
      console.log('User ID:', payload.userId)

    } catch (error) {
      // 検証失敗（改ざん、期限切れ、無効なトークンなど）
      console.error('JWT verification failed:', error)

      // 無効なトークンをクリア
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('token')

      if (!isPublicPath) {
        return response
      }
    }
  }

  // 未認証ユーザーが保護されたページにアクセスした場合
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## エラーハンドリング

### よくあるエラーと原因

```typescript
try {
  await jwtVerify(token, secret)
} catch (error) {
  if (error instanceof errors.JWTExpired) {
    // トークンの有効期限切れ
    console.error('Token expired')
  } else if (error instanceof errors.JWSSignatureVerificationFailed) {
    // 署名検証失敗（改ざんの可能性）
    console.error('Invalid signature')
  } else if (error instanceof errors.JWTInvalid) {
    // 無効なJWT形式
    console.error('Invalid JWT format')
  } else {
    // その他のエラー
    console.error('JWT verification failed:', error)
  }
}
```

### エラーの種類

| エラークラス | 原因 | 対処法 |
|------------|------|--------|
| `JWTExpired` | トークンの有効期限切れ | 再ログインを促す |
| `JWSSignatureVerificationFailed` | 署名が一致しない | トークンを削除してログイン画面へ |
| `JWTInvalid` | JWT形式が不正 | トークンを削除してログイン画面へ |
| `JWTClaimValidationFailed` | クレームの検証失敗 | トークンを削除してログイン画面へ |

## JWTトークンの生成（SignJWT）

ミドルウェアでは検証のみですが、トークン生成にもJOSEを使用できます。

### APIRouteでのJWT生成例

```typescript
import { SignJWT } from 'jose'

// JWT生成関数
async function generateJWT(userId: string, employeeNumber: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)

  const token = await new SignJWT({
    userId,
    employeeNumber,
  })
    .setProtectedHeader({ alg: 'HS256' })  // アルゴリズムを指定
    .setIssuedAt()                          // 発行時刻を設定
    .setExpirationTime('7d')                // 7日後に期限切れ
    .sign(secret)                           // 署名

  return token
}

// API Routeでの使用例
export async function POST(request: Request) {
  // ユーザー認証処理...

  const token = await generateJWT(user.id, user.employeeNumber)

  const response = NextResponse.json({ user })
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7日
    path: '/',
  })

  return response
}
```

### SignJWTのメソッド

| メソッド | 説明 | 例 |
|---------|------|-----|
| `setProtectedHeader()` | JWTヘッダーを設定 | `{ alg: 'HS256' }` |
| `setIssuedAt()` | 発行時刻を設定（現在時刻） | 自動で`iat`に設定 |
| `setExpirationTime()` | 有効期限を設定 | `'7d'`, `'24h'`, `'2w'` |
| `setNotBefore()` | 有効開始時刻を設定 | `'1h'` (1時間後から有効) |
| `setIssuer()` | 発行者を設定 | `'my-app'` |
| `setSubject()` | 主体（ユーザーID）を設定 | `userId` |
| `setAudience()` | 対象者を設定 | `'api.example.com'` |
| `sign()` | 署名してJWTを生成 | シークレットキーを渡す |

## 他のJWTライブラリとの比較

### jsonwebtoken vs jose

| 項目 | jsonwebtoken | jose |
|------|--------------|------|
| Edge Runtime対応 | ✗ | ✓ |
| 非同期処理 | 同期/非同期両方 | 非同期のみ |
| TypeScript型定義 | 別パッケージ必要 | 組み込み |
| Next.js推奨 | ✗ | ✓ |
| 依存関係 | 多い | 少ない |
| メンテナンス状況 | 活発 | 活発 |

### コード比較

```typescript
// jsonwebtoken（従来の方法）
import jwt from 'jsonwebtoken'

// 同期的に検証
try {
  const payload = jwt.verify(token, process.env.JWT_SECRET)
} catch (error) {
  // エラー処理
}

// jose（推奨される方法）
import { jwtVerify } from 'jose'

// 非同期で検証
try {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const { payload } = await jwtVerify(token, secret)
} catch (error) {
  // エラー処理
}
```

## セキュリティのベストプラクティス

### 1. シークレットキーの管理

```typescript
// ✓ 良い例: 環境変数から取得
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

// ✗ 悪い例: ハードコード
const secret = new TextEncoder().encode('my-secret-key')
```

### 2. 適切な有効期限の設定

```typescript
// ✓ 良い例: 適切な有効期限
.setExpirationTime('7d')  // 一般的なWebアプリ
.setExpirationTime('1h')  // セキュリティ重視の場合

// ✗ 悪い例: 有効期限なし、または長すぎる
.setExpirationTime('365d')
```

### 3. HTTPOnly Cookieの使用

```typescript
// ✓ 良い例: HTTPOnly Cookie
response.cookies.set('token', token, {
  httpOnly: true,           // JavaScriptからアクセス不可
  secure: true,             // HTTPS接続のみ
  sameSite: 'lax',          // CSRF対策
  path: '/',
})

// ✗ 悪い例: localStorageに保存
localStorage.setItem('token', token)  // XSS攻撃に脆弱
```

### 4. トークンのリフレッシュ

```typescript
// 有効期限が近い場合、新しいトークンを発行
const { payload } = await jwtVerify(token, secret)
const expiresIn = payload.exp! - Math.floor(Date.now() / 1000)

if (expiresIn < 60 * 60) {  // 1時間未満の場合
  // 新しいトークンを生成してリフレッシュ
  const newToken = await generateJWT(payload.userId, payload.employeeNumber)
  // レスポンスに新しいトークンを設定
}
```

## トラブルシューティング

### エラー: "Module not found: Can't resolve 'jose'"

**原因**: `jose`パッケージがインストールされていない

**解決策**:
```bash
npm install jose
```

### エラー: "TextEncoder is not defined"

**原因**: 古いNode.jsバージョンを使用している

**解決策**:
```bash
# Node.js 18以上にアップグレード
nvm install 18
nvm use 18
```

### エラー: "JWTExpired: exp claim timestamp check failed"

**原因**: トークンの有効期限が切れている

**解決策**:
```typescript
// トークンを削除してログイン画面へリダイレクト
response.cookies.delete('token')
return NextResponse.redirect(new URL('/login', request.url))
```

### エラー: "JWSSignatureVerificationFailed"

**原因**:
- シークレットキーが間違っている
- トークンが改ざんされている
- 開発環境と本番環境でシークレットキーが異なる

**解決策**:
```bash
# .envファイルのJWT_SECRETを確認
cat .env | grep JWT_SECRET

# 本番環境の環境変数を確認
# Vercelの場合: Settings > Environment Variables
```

## 実装チェックリスト

- [ ] `jose`パッケージをインストール済み
- [ ] `JWT_SECRET`を環境変数に設定済み
- [ ] ミドルウェアで`jwtVerify`を使用
- [ ] API Routeで`SignJWT`を使用してトークン生成
- [ ] HTTPOnly Cookieでトークンを保存
- [ ] 適切な有効期限を設定（推奨: 7日）
- [ ] エラーハンドリングを実装
- [ ] トークン検証失敗時のリダイレクト処理
- [ ] 本番環境でHTTPS + Secure Cookie使用

## 参考リンク

- [JOSE公式ドキュメント](https://github.com/panva/jose/blob/main/docs/README.md)
- [Next.js公式 - Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [JWT.io](https://jwt.io/) - JWTデバッグツール
- [RFC 7519 - JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519)

## 学んだこと

1. **Edge Runtime対応の重要性**: Next.jsミドルウェアはEdge Runtimeで動作するため、`jose`のような対応ライブラリが必要

2. **非同期処理**: `jwtVerify`は非同期関数なので、必ず`await`を使用する

3. **セキュリティ**: JWTの検証はサーバーサイド（ミドルウェア）で行うことで、クライアント側での改ざんを防ぐ

4. **エラーハンドリング**: トークン検証失敗時は、必ずクッキーを削除してログイン画面へリダイレクト

5. **型安全性**: TypeScriptの型定義が優れているため、開発体験が良い

## 関連ファイル

- `web/middleware.ts`: ミドルウェアでのjwtVerify使用
- `web/app/api/auth/login/route.ts`: SignJWTでトークン生成
- `web/app/api/auth/signup/route.ts`: SignJWTでトークン生成
- `web/.env`: JWT_SECRET環境変数
