'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminLoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [employeeNumber, setEmployeeNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // AuthContextのlogin関数を使用してユーザー状態を更新
      await login(employeeNumber, password)

      // ログイン後、ユーザー情報を再取得して管理者権限チェック
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('ユーザー情報の取得に失敗しました')
      }

      const data = await res.json()

      // 管理者権限チェック
      if (data.user.role !== 'ADMIN') {
        setError('管理者権限がありません')
        // ログアウト処理
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        })
        return
      }

      // 管理者ログイン成功 - ログを記録
      await fetch('/api/admin/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionType: 'LOGIN',
          details: '管理画面にログイン',
        }),
        credentials: 'include',
      })

      // 管理画面へリダイレクト
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-purple-100 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">管理者ログイン</h2>
            <p className="mt-2 text-sm text-gray-600">
              管理者権限を持つアカウントでログインしてください
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="employeeNumber" className="block text-sm font-medium text-gray-700 mb-2">
                社員番号
              </label>
              <input
                id="employeeNumber"
                type="text"
                required
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                placeholder="EMP001"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : '管理画面にログイン'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              一般ユーザーとしてログイン
            </Link>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>管理者権限についてのお問い合わせは管理部までご連絡ください</p>
        </div>
      </div>
    </div>
  )
}
