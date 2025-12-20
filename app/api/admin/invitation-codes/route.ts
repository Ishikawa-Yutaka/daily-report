import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { createAdminLog, getIpAddress } from '@/lib/adminLog'

// 招待コード一覧を取得
export async function GET(request: Request) {
  try {
    // 認証チェック
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // 管理者権限チェック
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
    })

    if (!userRecord || userRecord.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    // 招待コード一覧を取得
    const invitationCodes = await prisma.invitationCode.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(invitationCodes)
  } catch (error) {
    console.error('招待コード取得エラー:', error)
    return NextResponse.json(
      { error: '招待コードの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 招待コードを発行
export async function POST(request: Request) {
  try {
    // 認証チェック
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // 管理者権限チェック
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
    })

    if (!userRecord || userRecord.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { employeeNumber } = body

    // バリデーション
    if (!employeeNumber || typeof employeeNumber !== 'string') {
      return NextResponse.json(
        { error: '社員番号を入力してください' },
        { status: 400 }
      )
    }

    // 既に存在するかチェック
    const existing = await prisma.invitationCode.findUnique({
      where: { employeeNumber },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'この社員番号は既に発行されています' },
        { status: 400 }
      )
    }

    // 既にusersテーブルに存在するかチェック
    const existingUser = await prisma.user.findUnique({
      where: { employeeNumber },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'この社員番号は既に使用されています' },
        { status: 400 }
      )
    }

    // 招待コードを作成
    const invitationCode = await prisma.invitationCode.create({
      data: {
        employeeNumber,
        createdBy: user.userId,
      },
    })

    // ログに記録
    await createAdminLog({
      adminId: user.userId,
      actionType: 'VIEW_USERS', // 既存のアクションタイプを使用（将来的に CREATE_INVITATION_CODE を追加可能）
      details: `招待コードを発行: ${employeeNumber}`,
      ipAddress: getIpAddress(request),
    })

    return NextResponse.json(invitationCode)
  } catch (error) {
    console.error('招待コード発行エラー:', error)
    return NextResponse.json(
      { error: '招待コードの発行に失敗しました' },
      { status: 500 }
    )
  }
}
