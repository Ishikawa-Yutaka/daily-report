import { NextResponse } from 'next/server'

export async function POST() {
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
