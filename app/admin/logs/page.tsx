'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminRoute from '@/components/AdminRoute'
import Header from '@/components/Header'

interface AdminLog {
  id: string
  actionType: string
  targetUserId: string | null
  targetReportId: string | null
  details: string | null
  ipAddress: string | null
  createdAt: string
  admin: {
    id: string
    employeeNumber: string
    employeeName: string
    role: string
  }
}

const actionTypeLabels: Record<string, string> = {
  LOGIN: 'ログイン',
  LOGOUT: 'ログアウト',
  VIEW_REPORT: '日報閲覧',
  FILTER_REPORTS: '日報フィルター',
  CHANGE_USER_ROLE: '権限変更',
  VIEW_USERS: '社員一覧閲覧',
  VIEW_LOGS: 'ログ閲覧',
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    loadLogs()
  }, [filter])

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams()
      if (filter) params.append('actionType', filter)

      const res = await fetch(`/api/admin/log?${params.toString()}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('ログ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'LOGIN':
        return 'bg-green-100 text-green-800'
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800'
      case 'VIEW_REPORT':
      case 'VIEW_USERS':
      case 'VIEW_LOGS':
        return 'bg-blue-100 text-blue-800'
      case 'FILTER_REPORTS':
        return 'bg-purple-100 text-purple-800'
      case 'CHANGE_USER_ROLE':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <AdminRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">操作ログ</h1>
              <p className="mt-2 text-gray-600">管理者の操作履歴を確認できます</p>
            </div>
            <Link
              href="/admin"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← ダッシュボードに戻る
            </Link>
          </div>

          {/* フィルター */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              操作タイプでフィルター
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="">すべて</option>
              {Object.entries(actionTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* ログ一覧 */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                操作履歴（{logs.length}件）
              </h2>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                ログが見つかりません
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        日時
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        管理者
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        詳細
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IPアドレス
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {log.admin.employeeName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {log.admin.employeeNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(
                              log.actionType
                            )}`}
                          >
                            {actionTypeLabels[log.actionType] || log.actionType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                          {log.details || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">ログについて</h3>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>管理者のすべての操作が記録されています</li>
              <li>ログは最大100件まで表示されます</li>
              <li>このログ閲覧操作も記録されます</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminRoute>
  )
}
