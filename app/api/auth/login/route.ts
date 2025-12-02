import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { employeeNumber, password } = body

    // バリデーション
    if (!employeeNumber || !password) {
      return NextResponse.json(
        { error: '社員番号とパスワードを入力してください' },
        { status: 400 }
      )
    }

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { employeeNumber },
    })

    if (!user) {
      return NextResponse.json(
        { error: '社員番号またはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // パスワードを検証
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: '社員番号またはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // JWTトークンを生成
    const token = generateToken({
      userId: user.id,
      employeeNumber: user.employeeNumber,
      employeeName: user.employeeName,
    })

    // レスポンスにCookieをセット
    const response = NextResponse.json({
      user: {
        id: user.id,
        employeeNumber: user.employeeNumber,
        employeeName: user.employeeName,
      },
      token,
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7日間
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    )
  }
}
