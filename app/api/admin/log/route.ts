import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { createAdminLog, getAdminLogs, getIpAddress, AdminActionType } from '@/lib/adminLog'
import { prisma } from '@/lib/prisma'

// 管理者の操作ログを記録
export async function POST(request: Request) {
  try {
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
    const { actionType, targetUserId, targetReportId, details } = body

    if (!actionType) {
      return NextResponse.json(
        { error: 'actionTypeが必要です' },
        { status: 400 }
      )
    }

    const ipAddress = getIpAddress(request)

    const log = await createAdminLog({
      adminId: user.userId,
      actionType: actionType as AdminActionType,
      targetUserId,
      targetReportId,
      details,
      ipAddress,
    })

    return NextResponse.json({ success: true, log })
  } catch (error) {
    console.error('ログ記録エラー:', error)
    return NextResponse.json(
      { error: 'ログの記録に失敗しました' },
      { status: 500 }
    )
  }
}

// 管理者の操作ログを取得
export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId') || undefined
    const actionType = searchParams.get('actionType') as AdminActionType | undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const logs = await getAdminLogs({
      adminId,
      actionType,
      limit,
      offset,
    })

    // ログ閲覧もログに記録
    await createAdminLog({
      adminId: user.userId,
      actionType: 'VIEW_LOGS',
      details: `操作ログを閲覧（${logs.length}件）`,
      ipAddress: getIpAddress(request),
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('ログ取得エラー:', error)
    return NextResponse.json(
      { error: 'ログの取得に失敗しました' },
      { status: 500 }
    )
  }
}
