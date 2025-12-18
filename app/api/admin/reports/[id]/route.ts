import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { createAdminLog, getIpAddress } from '@/lib/adminLog'

// 管理者用: 特定の日報を取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // 日報を取得
    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: {
            order: 'asc',
          },
        },
        user: {
          select: {
            id: true,
            employeeNumber: true,
            employeeName: true,
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: '日報が見つかりません' },
        { status: 404 }
      )
    }

    // 日報詳細閲覧をログに記録
    await createAdminLog({
      adminId: user.userId,
      actionType: 'VIEW_REPORT',
      targetUserId: report.userId,
      targetReportId: report.id,
      details: `${report.user.employeeName}の日報を閲覧（${new Date(report.date).toLocaleDateString('ja-JP')}）`,
      ipAddress: getIpAddress(request),
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('日報取得エラー:', error)
    return NextResponse.json(
      { error: '日報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
