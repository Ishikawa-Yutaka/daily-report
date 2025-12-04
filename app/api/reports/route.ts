import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

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

    // ログインユーザーの日報のみ取得
    const reports = await prisma.dailyReport.findMany({
      where: {
        userId: user.userId,
      },
      include: {
        activities: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })
    return NextResponse.json(reports)
  } catch (error) {
    console.error('レポート取得エラー:', error)
    return NextResponse.json(
      { error: 'レポートの取得に失敗しました' },
      { status: 500 }
    )
  }
}

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

    const body = await request.json()
    const { date, quarterlyGoal, improvements, happyMoments, futureTasks, activities } = body

    // ログインユーザーの日報として作成
    const report = await prisma.dailyReport.create({
      data: {
        date: new Date(date),
        quarterlyGoal,
        improvements,
        happyMoments,
        futureTasks,
        userId: user.userId, // ログインユーザーのIDを使用
        activities: {
          create: activities.map((activity: any, index: number) => ({
            projectCategory: activity.projectCategory,
            content: activity.content,
            workingHours: activity.workingHours,
            issues: activity.issues,
            order: index,
          })),
        },
      },
      include: {
        activities: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('レポート作成エラー:', error)
    return NextResponse.json(
      { error: 'レポートの作成に失敗しました' },
      { status: 500 }
    )
  }
}
