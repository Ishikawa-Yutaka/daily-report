import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

/**
 * 初回セットアップAPI - スーパーアドミンを作成
 *
 * POST /api/setup
 *
 * 機能:
 * - 管理者が0人の場合のみ実行可能
 * - 最初のスーパーアドミン（削除・降格不可）を作成
 * - 自動的にログイン状態にする（JWTトークンをCookieにセット）
 *
 * リクエストボディ:
 * - employeeNumber: string - 社員番号
 * - employeeName: string - 社員名
 * - password: string - パスワード（6文字以上）
 *
 * レスポンス:
 * - user: object - 作成されたユーザー情報
 * - token: string - JWTトークン
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { employeeNumber, employeeName, password } = body

    // バリデーション
    if (!employeeNumber || !employeeName || !password) {
      return NextResponse.json(
        { error: 'すべての項目を入力してください' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上にしてください' },
        { status: 400 }
      )
    }

    // 管理者が既に存在するかチェック
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN',
      },
    })

    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'セットアップは既に完了しています' },
        { status: 403 }
      )
    }

    // 社員番号の重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { employeeNumber },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'この社員番号は既に登録されています' },
        { status: 409 }
      )
    }

    // パスワードをハッシュ化
    const passwordHash = await hashPassword(password)

    // スーパーアドミンを作成
    // role: ADMIN（管理者権限）
    // isSuperAdmin: true（削除・降格不可）
    const user = await prisma.user.create({
      data: {
        employeeNumber,
        employeeName,
        passwordHash,
        role: 'ADMIN',
        isSuperAdmin: true, // スーパーアドミンフラグをON
      },
    })

    // JWTトークンを生成
    const token = await generateToken({
      userId: user.id,
      employeeNumber: user.employeeNumber,
      employeeName: user.employeeName,
    })

    // レスポンスにCookieをセット（自動ログイン）
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          employeeNumber: user.employeeNumber,
          employeeName: user.employeeName,
          role: user.role,
          isSuperAdmin: user.isSuperAdmin,
        },
        token,
        message: 'スーパーアドミンを作成しました',
      },
      { status: 201 }
    )

    // Cookieに認証トークンをセット
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7日間
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Setup error:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'セットアップに失敗しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
