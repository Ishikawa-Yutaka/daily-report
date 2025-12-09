'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * 初回セットアップ画面
 *
 * このページは、システムに管理者が1人も存在しない場合のみアクセス可能です。
 * 最初のスーパーアドミン（super admin）を作成します。
 *
 * 機能:
 * - 管理者が既に存在する場合は404エラーを表示
 * - スーパーアドミンの作成（削除・降格不可能）
 * - 作成後は自動的に管理画面にログイン
 */
export default function SetupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    employeeNumber: '',
    employeeName: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  // ページアクセス時に管理者の存在チェック
  useEffect(() => {
    checkSetupAccess()
  }, [])

  /**
   * セットアップページへのアクセス権限をチェック
   * 既に管理者が存在する場合はアクセスを拒否
   */
  const checkSetupAccess = async () => {
    try {
      const res = await fetch('/api/setup/check')
      const data = await res.json()

      if (!data.canSetup) {
        // 既に管理者が存在する場合
        setAccessDenied(true)
      }
    } catch (err) {
      console.error('Setup access check failed:', err)
      setError('アクセス確認中にエラーが発生しました')
    } finally {
      setIsCheckingAccess(false)
    }
  }

  /**
   * スーパーアドミン作成フォーム送信処理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // パスワード確認
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    // パスワードの最小文字数チェック
    if (formData.password.length < 6) {
      setError('パスワードは6文字以上にしてください')
      return
    }

    setIsSubmitting(true)

    try {
      // スーパーアドミン作成API呼び出し
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeNumber: formData.employeeNumber,
          employeeName: formData.employeeName,
          password: formData.password,
        }),
        credentials: 'include', // Cookie認証を使用
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'セットアップに失敗しました')
      }

      // 成功時は管理画面にリダイレクト
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'セットアップに失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // アクセス確認中の表示
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">確認中...</p>
        </div>
      </div>
    )
  }

  // アクセス拒否時の表示（既に管理者が存在する場合）
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">アクセスできません</h2>
            <p className="text-gray-600 mb-6">
              このページは既にセットアップが完了しています。
            </p>
            <button
              onClick={() => router.push('/admin/login')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              管理者ログインへ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // セットアップフォーム表示
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-indigo-100 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">初回セットアップ</h2>
            <p className="mt-2 text-sm text-gray-600">
              最初の管理者アカウントを作成してください
            </p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                このアカウントはスーパーアドミンとして作成され、削除・降格できません。
              </p>
            </div>
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
                value={formData.employeeNumber}
                onChange={(e) =>
                  setFormData({ ...formData, employeeNumber: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="例: ADMIN001"
              />
            </div>

            <div>
              <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700 mb-2">
                社員名
              </label>
              <input
                id="employeeName"
                type="text"
                required
                value={formData.employeeName}
                onChange={(e) =>
                  setFormData({ ...formData, employeeName: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="例: システム管理者"
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
                minLength={6}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="6文字以上"
              />
              <p className="mt-1 text-xs text-gray-500">6文字以上で設定してください</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="パスワードを再入力"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'セットアップ中...' : '管理者アカウントを作成'}
            </button>
          </form>
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>このアカウントでシステム全体を管理できます</p>
        </div>
      </div>
    </div>
  )
}
