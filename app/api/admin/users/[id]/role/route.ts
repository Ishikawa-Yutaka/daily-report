import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { createAdminLog, getIpAddress } from '@/lib/adminLog'

// 社員の権限を変更
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    // 管理者権限チェック
    const adminUser = await prisma.user.findUnique({
      where: { id: user.userId },
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { role } = body

    if (!role || !['USER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: '有効なroleを指定してください（USER または ADMIN）' },
        { status: 400 }
      )
    }

    // 対象ユーザーを取得
    const targetUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // スーパーアドミンの保護: スーパーアドミンは降格できない
    if (targetUser.isSuperAdmin && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'スーパーアドミンの権限は変更できません' },
        { status: 403 }
      )
    }

    // 権限を更新
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        employeeNumber: true,
        employeeName: true,
        role: true,
        isSuperAdmin: true, // スーパーアドミンフラグも返す
        createdAt: true,
        updatedAt: true,
      },
    })

    // 操作ログを記録
    await createAdminLog({
      adminId: user.userId,
      actionType: 'CHANGE_USER_ROLE',
      targetUserId: id,
      details: `${targetUser.employeeName}（${targetUser.employeeNumber}）の権限を${targetUser.role}から${role}に変更`,
      ipAddress: getIpAddress(request),
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('権限変更エラー:', error)
    return NextResponse.json(
      { error: '権限の変更に失敗しました' },
      { status: 500 }
    )
  }
}
