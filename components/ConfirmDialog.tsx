/**
 * 確認ダイアログコンポーネント
 *
 * 削除などの重要な操作を実行する前にユーザーに確認を求めるモーダルダイアログです。
 *
 * @param isOpen - ダイアログの表示/非表示
 * @param onClose - キャンセルボタンまたは背景クリック時のコールバック
 * @param onConfirm - 確認ボタン押下時のコールバック
 * @param title - ダイアログのタイトル
 * @param message - ダイアログの本文メッセージ
 * @param confirmText - 確認ボタンのテキスト（デフォルト: "削除する"）
 * @param cancelText - キャンセルボタンのテキスト（デフォルト: "キャンセル"）
 * @param confirmButtonClass - 確認ボタンのカスタムクラス（デフォルト: 赤色の削除ボタン）
 */

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmButtonClass?: string
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '削除する',
  cancelText = 'キャンセル',
  confirmButtonClass = 'px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors',
}: ConfirmDialogProps) {
  // ダイアログが閉じている場合は何も表示しない
  if (!isOpen) return null

  return (
    // 背景オーバーレイ
    // fixed: 画面に固定表示
    // inset-0: 上下左右すべて0（画面全体を覆う）
    // bg-black bg-opacity-50: 黒色で50%の透明度
    // flex items-center justify-center: 中央配置
    // z-50: 他の要素より前面に表示
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* ダイアログ本体 */}
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* タイトル */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>

        {/* メッセージ */}
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* ボタンエリア */}
        <div className="flex justify-end gap-3">
          {/* キャンセルボタン */}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            {cancelText}
          </button>

          {/* 確認ボタン */}
          <button
            onClick={onConfirm}
            className={confirmButtonClass}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
