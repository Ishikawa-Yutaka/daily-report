'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DailyReportList from '@/components/DailyReportList'
import ProtectedRoute from '@/components/ProtectedRoute'
import Header from '@/components/Header'
import { DailyReport } from '@/types/daily-report'

export default function Home() {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const res = await fetch('/api/reports', {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setReports(data)
      }
    } catch (error) {
      console.error('レポート取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : (
            <>
              <DailyReportList reports={reports} />

              <Link
                href="/reports/new"
                className="fixed bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white font-bold w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl transition-colors"
                title="新規日報作成"
              >
                +
              </Link>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
