import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { createAdminLog, getIpAddress } from '@/lib/adminLog'

// 管理者用: 全社員の日報取得（フィルタリング機能付き）
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

    // クエリパラメータからフィルター条件を取得
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const employeeNumber = searchParams.get('employeeNumber')

    // フィルター条件を構築
    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (employeeNumber) {
      const targetUser = await prisma.user.findUnique({
        where: { employeeNumber },
      })
      if (targetUser) {
        where.userId = targetUser.id
      }
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    // 全社員の日報を取得
    const reports = await prisma.dailyReport.findMany({
      where,
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
      orderBy: {
        date: 'desc',
      },
    })

    // 日報一覧閲覧をログに記録
    const filterDetails = []
    if (userId) filterDetails.push(`社員ID: ${userId}`)
    if (employeeNumber) filterDetails.push(`社員番号: ${employeeNumber}`)
    if (startDate) filterDetails.push(`開始日: ${startDate}`)
    if (endDate) filterDetails.push(`終了日: ${endDate}`)

    await createAdminLog({
      adminId: user.userId,
      actionType: 'FILTER_REPORTS',
      targetUserId: userId || undefined,
      details: `日報一覧を閲覧（${reports.length}件）${filterDetails.length > 0 ? ' - フィルター: ' + filterDetails.join(', ') : ''}`,
      ipAddress: getIpAddress(request),
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('管理者用レポート取得エラー:', error)
    return NextResponse.json(
      { error: 'レポートの取得に失敗しました' },
      { status: 500 }
    )
  }
}
