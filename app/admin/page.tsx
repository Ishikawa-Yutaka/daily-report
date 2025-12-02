'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminRoute from '@/components/AdminRoute'
import Header from '@/components/Header'
import { DailyReportWithUser } from '@/types/daily-report'

interface UserSummary {
  id: string
  employeeNumber: string
  employeeName: string
  role: string
  reportsCount: number
}

export default function AdminDashboard() {
  const [reports, setReports] = useState<DailyReportWithUser[]>([])
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // 社員一覧を取得
      const usersRes = await fetch('/api/admin/users', {
        credentials: 'include',
      })
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.map((u: any) => ({
          id: u.id,
          employeeNumber: u.employeeNumber,
          employeeName: u.employeeName,
          role: u.role,
          reportsCount: u._count.reports,
        })))
      }

      // 全日報を取得
      await loadReports()
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReports = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedUserId) params.append('userId', selectedUserId)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const reportsRes = await fetch(`/api/admin/reports?${params.toString()}`, {
        credentials: 'include',
      })
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json()
        setReports(reportsData)
      }
    } catch (error) {
      console.error('日報取得エラー:', error)
    }
  }

  const handleFilter = () => {
    loadReports()
  }

  const handleReset = () => {
    setSelectedUserId('')
    setStartDate('')
    setEndDate('')
    setTimeout(() => loadReports(), 0)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }

  const getTotalHours = (report: DailyReportWithUser) => {
    return report.activities.reduce((sum, a) => sum + a.workingHours, 0)
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
            <p className="mt-2 text-gray-600">全社員の日報を確認できます</p>
          </div>

          {/* ナビゲーション */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Link
              href="/admin"
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-4 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="font-semibold">日報一覧</div>
                  <div className="text-sm opacity-90">全社員の日報を閲覧</div>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg p-4 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <div>
                  <div className="font-semibold">社員管理</div>
                  <div className="text-sm opacity-90">権限の付与・変更</div>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/logs"
              className="bg-gray-700 hover:bg-gray-800 text-white rounded-lg p-4 transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div>
                  <div className="font-semibold">操作ログ</div>
                  <div className="text-sm opacity-90">管理者の操作履歴</div>
                </div>
              </div>
            </Link>
          </div>

          {/* フィルターセクション */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">フィルター</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  社員
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">全社員</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.employeeName} ({user.employeeNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開始日
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了日
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleFilter}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                フィルター適用
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                リセット
              </button>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">社員数</h3>
              <p className="text-3xl font-bold text-blue-600">{users.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">日報総数</h3>
              <p className="text-3xl font-bold text-green-600">{reports.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">総稼働時間</h3>
              <p className="text-3xl font-bold text-purple-600">
                {reports.reduce((sum, r) => sum + getTotalHours(r), 0).toFixed(1)}h
              </p>
            </div>
          </div>

          {/* 日報一覧 */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">日報一覧</h2>
            </div>

            {reports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                日報が見つかりません
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        日付
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        社員
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        活動数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        稼働時間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(report.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {report.user.employeeName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {report.user.employeeNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.activities.length}件
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getTotalHours(report).toFixed(1)}時間
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/admin/reports/${report.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            詳細を見る
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminRoute>
  )
}
