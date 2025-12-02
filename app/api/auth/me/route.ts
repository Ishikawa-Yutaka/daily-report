import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  const user = getUserFromRequest(request)

  if (!user) {
    return NextResponse.json(
      { error: '認証が必要です' },
      { status: 401 }
    )
  }

  return NextResponse.json({ user })
}
