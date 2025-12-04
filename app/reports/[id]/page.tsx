'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Activity, DailyReport, CreateDailyReportInput } from '@/types/daily-report'
import ProtectedRoute from '@/components/ProtectedRoute'
import Header from '@/components/Header'
import DailyReportForm from '@/components/DailyReportForm'

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    loadReport()
  }, [id])

  const loadReport = async () => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      }
    } catch (error) {
      console.error('レポート取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (data: CreateDailyReportInput) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const updatedReport = await res.json()
        setReport(updatedReport)
        setIsEditing(false)
        alert('日報を更新しました')
      } else {
        const error = await res.json()
        alert(error.error || '更新に失敗しました')
      }
    } catch (error) {
      console.error('更新エラー:', error)
      alert('更新に失敗しました')
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!report) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <p className="text-gray-600">日報が見つかりません</p>
              <Link href="/" className="text-blue-500 hover:text-blue-600 mt-4 inline-block">
                一覧に戻る
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // 編集モードの場合はフォームを表示
  if (isEditing) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ← 戻る
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                  日報を編集
                </h1>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                キャンセル
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md">
              <DailyReportForm
                onSubmit={handleUpdate}
                initialData={{
                  date: new Date(report.date),
                  dailyGoal: report.dailyGoal,
                  improvements: report.improvements,
                  happyMoments: report.happyMoments,
                  futureTasks: report.futureTasks,
                  activities: report.activities.map((a: Activity) => ({
                    projectCategory: a.projectCategory,
                    content: a.content,
                    workingHours: a.workingHours,
                    startTime: a.startTime || '',
                    endTime: a.endTime || '',
                    issues: a.issues,
                    order: a.order,
                  })),
                }}
                isEditing={true}
              />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // 閲覧モード
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← 戻る
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                日報詳細
              </h1>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              編集
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {formatDate(report.date)}
            </h2>
            <p className="text-sm text-gray-500">
              最終更新: {new Date(report.updatedAt).toLocaleString('ja-JP')}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                本日の目標
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {report.dailyGoal}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  活動セクション
                </h3>
                <span className="text-sm text-gray-600">
                  合計稼働時間: {report.activities.reduce((sum: number, a: Activity) => sum + a.workingHours, 0).toFixed(1)}時間
                </span>
              </div>

              {report.activities.map((activity: Activity, index: number) => (
                <div key={activity.id} className="mb-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="mb-3">
                    <span className="inline-block bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      活動 {index + 1}
                    </span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {activity.projectCategory}
                    </span>
                    {activity.startTime && activity.endTime && (
                      <span className="ml-2 text-sm text-gray-600">
                        {activity.startTime} 〜 {activity.endTime}
                      </span>
                    )}
                    <span className="ml-2 text-sm text-gray-600">
                      ({activity.workingHours}時間)
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">活動内容:</p>
                      <p className="text-gray-600 whitespace-pre-wrap text-sm pl-2">
                        {activity.content}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">課題:</p>
                      <p className="text-gray-600 whitespace-pre-wrap text-sm pl-2">
                        {activity.issues}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                改善点・気づき
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {report.improvements}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                嬉しかったこと・感動したこと
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {report.happyMoments}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                これからのタスク
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {report.futureTasks}
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
