import Link from 'next/link'

type AdminPage = 'dashboard' | 'users' | 'invitation-codes' | 'logs'

interface AdminNavigationProps {
  currentPage: AdminPage
}

export default function AdminNavigation({ currentPage }: AdminNavigationProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 日報一覧 */}
      {currentPage === 'dashboard' ? (
        <div className="bg-blue-600 text-white rounded-lg p-4 border-4 border-blue-300">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <div className="font-semibold">日報一覧</div>
              <div className="text-sm opacity-90">全社員の日報を閲覧</div>
            </div>
          </div>
        </div>
      ) : (
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
      )}

      {/* 社員管理 */}
      {currentPage === 'users' ? (
        <div className="bg-purple-600 text-white rounded-lg p-4 border-4 border-purple-300">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <div>
              <div className="font-semibold">社員管理</div>
              <div className="text-sm opacity-90">権限の付与・変更</div>
            </div>
          </div>
        </div>
      ) : (
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
      )}

      {/* 招待コード */}
      {currentPage === 'invitation-codes' ? (
        <div className="bg-green-600 text-white rounded-lg p-4 border-4 border-green-300">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <div>
              <div className="font-semibold">招待コード</div>
              <div className="text-sm opacity-90">社員番号の発行</div>
            </div>
          </div>
        </div>
      ) : (
        <Link
          href="/admin/invitation-codes"
          className="bg-green-500 hover:bg-green-600 text-white rounded-lg p-4 transition-colors"
        >
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <div>
              <div className="font-semibold">招待コード</div>
              <div className="text-sm opacity-90">社員番号の発行</div>
            </div>
          </div>
        </Link>
      )}

      {/* 操作ログ */}
      {currentPage === 'logs' ? (
        <div className="bg-gray-800 text-white rounded-lg p-4 border-4 border-gray-500">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div>
              <div className="font-semibold">操作ログ</div>
              <div className="text-sm opacity-90">管理者の操作履歴</div>
            </div>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  )
}
