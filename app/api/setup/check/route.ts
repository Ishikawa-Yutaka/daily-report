import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * セットアップページへのアクセス可否をチェックするAPI
 *
 * GET /api/setup/check
 *
 * 機能:
 * - データベース内に管理者が存在するかをチェック
 * - 管理者が0人の場合のみセットアップページへのアクセスを許可
 *
 * レスポンス:
 * - canSetup: boolean - セットアップページにアクセス可能かどうか
 * - hasAdmin: boolean - 管理者が既に存在するかどうか
 */
export async function GET() {
  try {
    // 管理者権限を持つユーザーの数をカウント
    const adminCount = await prisma.user.count({
      where: {
        role: 'ADMIN',
      },
    })

    // 管理者が0人の場合のみセットアップ可能
    const canSetup = adminCount === 0

    return NextResponse.json({
      canSetup,
      hasAdmin: !canSetup,
    })
  } catch (error) {
    console.error('Setup check error:', error)
    return NextResponse.json(
      { error: 'セットアップチェックに失敗しました' },
      { status: 500 }
    )
  }
}
