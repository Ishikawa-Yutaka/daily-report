'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminRoute from '@/components/AdminRoute'
import Header from '@/components/Header'

interface User {
  id: string
  employeeNumber: string
  employeeName: string
  role: 'USER' | 'ADMIN'
  createdAt: string
  _count: {
    reports: number
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [changingRole, setChangingRole] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('社員リスト取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    const actionText = newRole === 'ADMIN' ? '管理者に昇格' : '一般ユーザーに降格'

    if (!confirm(`この社員を${actionText}しますか？`)) {
      return
    }

    setChangingRole(userId)

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
        credentials: 'include',
      })

      if (res.ok) {
        await loadUsers()
        alert(`権限を${actionText}しました`)
      } else {
        const error = await res.json()
        alert(`エラー: ${error.error}`)
      }
    } catch (error) {
      console.error('権限変更エラー:', error)
      alert('権限の変更に失敗しました')
    } finally {
      setChangingRole(null)
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
              <h1 className="text-3xl font-bold text-gray-900">社員管理</h1>
              <p className="mt-2 text-gray-600">社員の権限を管理できます</p>
            </div>
            <Link
              href="/admin"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← ダッシュボードに戻る
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                全社員一覧（{users.length}名）
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      社員番号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      氏名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      権限
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日報数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      登録日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.employeeNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.employeeName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === 'ADMIN' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            管理者
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            一般ユーザー
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user._count.reports}件
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleRoleChange(user.id, user.role)}
                          disabled={changingRole === user.id}
                          className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            user.role === 'ADMIN'
                              ? 'bg-gray-500 hover:bg-gray-600 text-white'
                              : 'bg-purple-500 hover:bg-purple-600 text-white'
                          } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                        >
                          {changingRole === user.id
                            ? '変更中...'
                            : user.role === 'ADMIN'
                            ? '一般ユーザーに降格'
                            : '管理者に昇格'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">注意事項</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>管理者権限を持つ社員は、管理画面にアクセスできます</li>
              <li>管理者は他の社員の日報を閲覧・検索できます</li>
              <li>権限変更の操作はすべてログに記録されます</li>
              <li>自分自身の権限を変更することもできますが、注意してください</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminRoute>
  )
}
