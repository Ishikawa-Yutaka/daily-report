import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
const JWT_EXPIRES_IN = '7d' // 7日間有効

export interface JWTPayload {
  userId: string
  employeeNumber: string
  employeeName: string
  role?: string
}

// パスワードをハッシュ化
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// パスワードを検証
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// JWTトークンを生成
export async function generateToken(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret)

  return token
}

// JWTトークンを検証
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload as JWTPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// リクエストからトークンを取得
export function getTokenFromRequest(request: Request): string | null {
  // Authorization ヘッダーから取得
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Cookieから取得
  const cookies = request.headers.get('Cookie')
  if (cookies) {
    const tokenCookie = cookies
      .split(';')
      .find((c) => c.trim().startsWith('token='))
    if (tokenCookie) {
      return tokenCookie.split('=')[1]
    }
  }

  return null
}

// リクエストから認証済みユーザー情報を取得
export async function getUserFromRequest(request: Request): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return await verifyToken(token)
}
