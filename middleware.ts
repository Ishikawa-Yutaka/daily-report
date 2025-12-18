import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// 認証が不要なパス
const publicPaths = ['/login', '/signup', '/admin/login', '/setup']

// 認証済みユーザーがアクセスできないパス（ログイン済みなら/にリダイレクト）
// 注: /admin/loginは含めない（管理者は別のログインフォーム）
const authPaths = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公開パスの場合、認証チェックをスキップ
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))

  // クッキーからJWTトークンを取得
  const token = request.cookies.get('token')?.value

  // トークンの検証
  let isAuthenticated = false
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET)
      await jwtVerify(token, secret)
      isAuthenticated = true
    } catch (error) {
      // トークンが無効な場合、クッキーをクリア
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('token')
      if (!isPublicPath) {
        return response
      }
    }
  }

  // 認証済みユーザーがログイン/サインアップページにアクセスした場合
  if (isAuthenticated && isAuthPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 未認証ユーザーが保護されたページにアクセスした場合
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    /*
     * 以下のパスを除く全てのパスにマッチ:
     * - api (APIルート)
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
