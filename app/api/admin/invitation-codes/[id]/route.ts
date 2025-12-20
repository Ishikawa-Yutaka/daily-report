import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { createAdminLog, getIpAddress } from '@/lib/adminLog'

// 招待コードを削除
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

    // 招待コードを取得
    const invitationCode = await prisma.invitationCode.findUnique({
      where: { id },
    })

    if (!invitationCode) {
      return NextResponse.json(
        { error: '招待コードが見つかりません' },
        { status: 404 }
      )
    }

    // 使用済みの場合は削除を拒否（任意：履歴保護）
    if (invitationCode.isUsed) {
      return NextResponse.json(
        { error: '使用済みの招待コードは削除できません' },
        { status: 400 }
      )
    }

    // 招待コードを削除
    await prisma.invitationCode.delete({
      where: { id },
    })

    // ログに記録
    await createAdminLog({
      adminId: user.userId,
      actionType: 'VIEW_USERS',
      details: `招待コードを削除: ${invitationCode.employeeNumber}`,
      ipAddress: getIpAddress(request),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('招待コード削除エラー:', error)
    return NextResponse.json(
      { error: '招待コードの削除に失敗しました' },
      { status: 500 }
    )
  }
}
