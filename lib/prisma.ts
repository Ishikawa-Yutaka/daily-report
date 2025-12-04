// PrismaClientのインポート
// Prismaクライアントは、データベースとの接続を管理するシングルトンオブジェクト
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// グローバルオブジェクトの型定義
// 開発環境でホットリロード時にPrismaClientインスタンスを再利用するため
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// PostgreSQL接続プールの作成
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Prisma PostgreSQLアダプターの作成
const adapter = new PrismaPg(pool)

// PrismaClientのインスタンスを作成
// 既にグローバルに存在する場合はそれを使用、なければ新規作成
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

// 開発環境では、ホットリロード時にインスタンスを保持
// 本番環境では毎回新しいインスタンスを作成
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
