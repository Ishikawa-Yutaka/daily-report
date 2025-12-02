import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

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

    // ユーザーを作成
    const user = await prisma.user.create({
      data: {
        employeeNumber,
        employeeName,
        passwordHash,
      },
    })

    // JWTトークンを生成
    const token = generateToken({
      userId: user.id,
      employeeNumber: user.employeeNumber,
      employeeName: user.employeeName,
    })

    // レスポンスにCookieをセット
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          employeeNumber: user.employeeNumber,
          employeeName: user.employeeName,
        },
        token,
      },
      { status: 201 }
    )

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7日間
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'ユーザー登録に失敗しました' },
      { status: 500 }
    )
  }
}
