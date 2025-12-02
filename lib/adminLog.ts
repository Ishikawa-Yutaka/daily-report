import { prisma } from '@/lib/prisma'

export type AdminActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'VIEW_REPORT'
  | 'FILTER_REPORTS'
  | 'CHANGE_USER_ROLE'
  | 'VIEW_USERS'
  | 'VIEW_LOGS'

export interface CreateAdminLogInput {
  adminId: string
  actionType: AdminActionType
  targetUserId?: string
  targetReportId?: string
  details?: string
  ipAddress?: string
}

/**
 * 管理者の操作ログを記録
 */
export async function createAdminLog(input: CreateAdminLogInput) {
  try {
    const log = await prisma.adminLog.create({
      data: {
        adminId: input.adminId,
        actionType: input.actionType,
        targetUserId: input.targetUserId,
        targetReportId: input.targetReportId,
        details: input.details,
        ipAddress: input.ipAddress,
      },
    })
    return log
  } catch (error) {
    console.error('管理者ログ記録エラー:', error)
    // ログ記録失敗は致命的エラーにしない
    return null
  }
}

/**
 * リクエストからIPアドレスを取得
 */
export function getIpAddress(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return undefined
}

/**
 * 管理者ログを取得（ページネーション対応）
 */
export async function getAdminLogs(options?: {
  adminId?: string
  actionType?: AdminActionType
  limit?: number
  offset?: number
}) {
  const where: any = {}

  if (options?.adminId) {
    where.adminId = options.adminId
  }

  if (options?.actionType) {
    where.actionType = options.actionType
  }

  const logs = await prisma.adminLog.findMany({
    where,
    include: {
      admin: {
        select: {
          id: true,
          employeeNumber: true,
          employeeName: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit || 100,
    skip: options?.offset || 0,
  })

  return logs
}
