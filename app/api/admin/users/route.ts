import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { createAdminLog, getIpAddress } from '@/lib/adminLog'

// 管理者用: 全社員のリスト取得
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

    // 全社員を取得（パスワードハッシュは除外）
    const users = await prisma.user.findMany({
      select: {
        id: true,
        employeeNumber: true,
        employeeName: true,
        role: true,
        isSuperAdmin: true, // スーパーアドミンフラグも返す
        createdAt: true,
        _count: {
          select: {
            reports: true,
          },
        },
      },
      orderBy: {
        employeeNumber: 'asc',
      },
    })

    // 社員一覧閲覧をログに記録
    await createAdminLog({
      adminId: user.userId,
      actionType: 'VIEW_USERS',
      details: `社員一覧を閲覧（${users.length}名）`,
      ipAddress: getIpAddress(request),
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('社員リスト取得エラー:', error)
    return NextResponse.json(
      { error: '社員リストの取得に失敗しました' },
      { status: 500 }
    )
  }
}
