import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

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

    const { id } = await params
    // 自分の日報のみ取得（他人の日報は見られない）
    const report = await prisma.dailyReport.findFirst({
      where: {
        id,
        userId: user.userId,
      },
      include: {
        activities: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: 'レポートが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('レポート取得エラー:', error)
    return NextResponse.json(
      { error: 'レポートの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { date, quarterlyGoal, improvements, happyMoments, futureTasks, activities } = body

    // 既存のアクティビティを削除して新しいものを作成
    const report = await prisma.dailyReport.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(quarterlyGoal !== undefined && { quarterlyGoal }),
        ...(improvements !== undefined && { improvements }),
        ...(happyMoments !== undefined && { happyMoments }),
        ...(futureTasks !== undefined && { futureTasks }),
        ...(activities && {
          activities: {
            deleteMany: {},
            create: activities.map((activity: any, index: number) => ({
              projectCategory: activity.projectCategory,
              content: activity.content,
              workingHours: activity.workingHours,
              issues: activity.issues,
              order: index,
            })),
          },
        }),
      },
      include: {
        activities: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('レポート更新エラー:', error)
    return NextResponse.json(
      { error: 'レポートの更新に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const { id } = await params

    // 自分の日報のみ削除可能
    const report = await prisma.dailyReport.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: 'レポートが見つかりません' },
        { status: 404 }
      )
    }

    await prisma.dailyReport.delete({
      where: { id },
    })

    return NextResponse.json({ message: '削除成功' })
  } catch (error) {
    console.error('レポート削除エラー:', error)
    return NextResponse.json(
      { error: 'レポートの削除に失敗しました' },
      { status: 500 }
    )
  }
}
