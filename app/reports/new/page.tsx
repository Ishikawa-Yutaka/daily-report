'use client'

import { useRouter } from 'next/navigation'
import DailyReportForm from '@/components/DailyReportForm'
import { CreateDailyReportInput } from '@/types/daily-report'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import Header from '@/components/Header'

export default function NewReportPage() {
  const router = useRouter()

  const handleSubmit = async (data: CreateDailyReportInput) => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('作成に失敗しました')
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('エラー:', error)
      alert('日報の作成に失敗しました')
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← 戻る
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">新規日報作成</h1>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            <DailyReportForm onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
