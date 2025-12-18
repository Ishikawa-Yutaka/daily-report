import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { createAdminLog, getIpAddress } from '@/lib/adminLog'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  // ログアウト前にユーザー情報を取得（管理者の場合はログを記録）
  const user = await getUserFromRequest(request)

  if (user) {
    // 管理者の場合、ログアウトをログに記録
    const userRecord = await prisma.user.findUnique({
      where: { id: user.userId },
    })

    if (userRecord && userRecord.role === 'ADMIN') {
      await createAdminLog({
        adminId: user.userId,
        actionType: 'LOGOUT',
        details: '管理者がログアウトしました',
        ipAddress: getIpAddress(request),
      })
    }
  }

  const response = NextResponse.json({ message: 'ログアウトしました' })

  // Cookieを削除
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return response
}
