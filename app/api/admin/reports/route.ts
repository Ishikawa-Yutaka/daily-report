import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

// 管理者用: 全社員の日報取得（フィルタリング機能付き）
export async function GET(request: Request) {
  try {
    // 認証チェック
    const user = getUserFromRequest(request)
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

    return NextResponse.json(reports)
  } catch (error) {
    console.error('管理者用レポート取得エラー:', error)
    return NextResponse.json(
      { error: 'レポートの取得に失敗しました' },
      { status: 500 }
    )
  }
}
