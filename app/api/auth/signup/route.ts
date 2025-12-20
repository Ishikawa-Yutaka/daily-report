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

    // 招待コードの存在チェック
    const invitationCode = await prisma.invitationCode.findUnique({
      where: { employeeNumber },
    })

    if (!invitationCode) {
      return NextResponse.json(
        { error: 'この社員番号は発行されていません。管理者に確認してください。' },
        { status: 403 }
      )
    }

    // 招待コードが既に使用されているかチェック
    if (invitationCode.isUsed) {
      return NextResponse.json(
        { error: 'この社員番号は既に使用されています' },
        { status: 409 }
      )
    }

    // 社員番号の重複チェック（念のため）
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

    // ユーザーを作成し、招待コードを使用済みにする（トランザクション）
    const user = await prisma.$transaction(async (tx) => {
      // ユーザーを作成
      const newUser = await tx.user.create({
        data: {
          employeeNumber,
          employeeName,
          passwordHash,
        },
      })

      // 招待コードを使用済みに更新
      await tx.invitationCode.update({
        where: { id: invitationCode.id },
        data: {
          isUsed: true,
          usedBy: newUser.id,
          usedAt: new Date(),
        },
      })

      return newUser
    })

    // JWTトークンを生成
    const token = await generateToken({
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
