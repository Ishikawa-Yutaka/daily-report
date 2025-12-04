'use client'

import { useState, useRef, useEffect } from 'react'
import { CreateDailyReportInput, CreateActivityInput } from '@/types/daily-report'

interface DailyReportFormProps {
  onSubmit: (data: CreateDailyReportInput) => Promise<void>
  initialData?: Partial<CreateDailyReportInput>
  isEditing?: boolean
}

export default function DailyReportForm({
  onSubmit,
  initialData,
  isEditing = false,
}: DailyReportFormProps) {
  const [formData, setFormData] = useState<CreateDailyReportInput>({
    date: initialData?.date || new Date(),
    dailyGoal: initialData?.dailyGoal || '',
    improvements: initialData?.improvements || '',
    happyMoments: initialData?.happyMoments || '',
    futureTasks: initialData?.futureTasks || '',
    activities: initialData?.activities || [
      {
        projectCategory: '',
        content: '',
        workingHours: 0,
        startTime: '',
        endTime: '',
        issues: '',
        order: 0,
      },
    ],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)


  // テキストエリアの自動リサイズ関数
  const autoResize = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto'
    element.style.height = element.scrollHeight + 'px'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'date' ? new Date(value) : value,
    }))
  }

  const handleActivityChange = (
    index: number,
    field: keyof CreateActivityInput,
    value: string | number
  ) => {
    setFormData((prev) => {
      const newActivities = [...prev.activities]
      newActivities[index] = {
        ...newActivities[index],
        [field]: value,
      }
      return { ...prev, activities: newActivities }
    })
  }

  const addActivity = () => {
    setFormData((prev) => ({
      ...prev,
      activities: [
        ...prev.activities,
        {
          projectCategory: '',
          content: '',
          workingHours: 0,
          startTime: '',
          endTime: '',
          issues: '',
          order: prev.activities.length,
        },
      ],
    }))
  }

  const removeActivity = (index: number) => {
    if (formData.activities.length === 1) {
      alert('最低1つの活動セクションが必要です')
      return
    }
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto p-6">
      <div>
        <label htmlFor="date" className="block text-sm font-medium mb-2 text-gray-700">
          日付
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={
            formData.date instanceof Date
              ? new Date(formData.date.getTime() - formData.date.getTimezoneOffset() * 60000).toISOString().split('T')[0]
              : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
          }
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
      </div>

      <div>
        <label htmlFor="dailyGoal" className="block text-sm font-medium mb-2 text-gray-700">
          本日の目標
        </label>
        <textarea
          id="dailyGoal"
          name="dailyGoal"
          value={formData.dailyGoal}
          onChange={handleChange}
          onInput={(e) => autoResize(e.currentTarget)}
          required
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-gray-900 placeholder:text-gray-400 overflow-hidden"
          placeholder="本日の目標を記入してください"
        />
      </div>

      <div className="border-t pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">活動セクション</h3>
        </div>

        {formData.activities.map((activity, index) => (
          <div key={index} id={`activity-${index}`} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 scroll-mt-20">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-700">活動 {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeActivity(index)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                削除
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  プロジェクト / カテゴリー
                </label>
                <input
                  type="text"
                  value={activity.projectCategory}
                  onChange={(e) =>
                    handleActivityChange(index, 'projectCategory', e.target.value)
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  placeholder="例: プロジェクトA、研修、営業活動など"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  活動内容
                </label>
                <textarea
                  value={activity.content}
                  onChange={(e) =>
                    handleActivityChange(index, 'content', e.target.value)
                  }
                  onInput={(e) => autoResize(e.currentTarget)}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-gray-900 placeholder:text-gray-400 overflow-hidden"
                  placeholder="この活動の詳細を記入してください"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  稼働時間
                </label>
                <div className="flex gap-2 items-center">
                  {/* 開始時刻 */}
                  <div className="flex gap-1 items-center">
                    <select
                      value={activity.startTime ? activity.startTime.split(':')[0] : ''}
                      onChange={(e) => {
                        const hour = e.target.value
                        const min = activity.startTime ? activity.startTime.split(':')[1] : '00'
                        const startTime = `${hour}:${min}`
                        handleActivityChange(index, 'startTime', startTime)
                        if (activity.endTime) {
                          const [startHour, startMin] = startTime.split(':').map(Number)
                          const [endHour, endMin] = activity.endTime.split(':').map(Number)
                          const startMinutes = startHour * 60 + startMin
                          const endMinutes = endHour * 60 + endMin
                          const diffMinutes = endMinutes - startMinutes
                          const hours = diffMinutes / 60
                          handleActivityChange(index, 'workingHours', parseFloat(hours.toFixed(2)))
                        }
                      }}
                      required
                      className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">--</option>
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={String(h).padStart(2, '0')}>
                          {String(h).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-600">:</span>
                    <select
                      value={activity.startTime ? activity.startTime.split(':')[1] : ''}
                      onChange={(e) => {
                        const hour = activity.startTime ? activity.startTime.split(':')[0] : '00'
                        const min = e.target.value
                        const startTime = `${hour}:${min}`
                        handleActivityChange(index, 'startTime', startTime)
                        if (activity.endTime) {
                          const [startHour, startMin] = startTime.split(':').map(Number)
                          const [endHour, endMin] = activity.endTime.split(':').map(Number)
                          const startMinutes = startHour * 60 + startMin
                          const endMinutes = endHour * 60 + endMin
                          const diffMinutes = endMinutes - startMinutes
                          const hours = diffMinutes / 60
                          handleActivityChange(index, 'workingHours', parseFloat(hours.toFixed(2)))
                        }
                      }}
                      required
                      className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">--</option>
                      {[0, 10, 20, 30, 40, 50].map((m) => (
                        <option key={m} value={String(m).padStart(2, '0')}>
                          {String(m).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-gray-600">〜</span>

                  {/* 終了時刻 */}
                  <div className="flex gap-1 items-center">
                    <select
                      value={activity.endTime ? activity.endTime.split(':')[0] : ''}
                      onChange={(e) => {
                        const hour = e.target.value
                        const min = activity.endTime ? activity.endTime.split(':')[1] : '00'
                        const endTime = `${hour}:${min}`
                        handleActivityChange(index, 'endTime', endTime)
                        if (activity.startTime) {
                          const [startHour, startMin] = activity.startTime.split(':').map(Number)
                          const [endHour, endMin] = endTime.split(':').map(Number)
                          const startMinutes = startHour * 60 + startMin
                          const endMinutes = endHour * 60 + endMin
                          const diffMinutes = endMinutes - startMinutes
                          const hours = diffMinutes / 60
                          handleActivityChange(index, 'workingHours', parseFloat(hours.toFixed(2)))
                        }
                      }}
                      required
                      className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">--</option>
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={String(h).padStart(2, '0')}>
                          {String(h).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-600">:</span>
                    <select
                      value={activity.endTime ? activity.endTime.split(':')[1] : ''}
                      onChange={(e) => {
                        const hour = activity.endTime ? activity.endTime.split(':')[0] : '00'
                        const min = e.target.value
                        const endTime = `${hour}:${min}`
                        handleActivityChange(index, 'endTime', endTime)
                        if (activity.startTime) {
                          const [startHour, startMin] = activity.startTime.split(':').map(Number)
                          const [endHour, endMin] = endTime.split(':').map(Number)
                          const startMinutes = startHour * 60 + startMin
                          const endMinutes = endHour * 60 + endMin
                          const diffMinutes = endMinutes - startMinutes
                          const hours = diffMinutes / 60
                          handleActivityChange(index, 'workingHours', parseFloat(hours.toFixed(2)))
                        }
                      }}
                      required
                      className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">--</option>
                      {[0, 10, 20, 30, 40, 50].map((m) => (
                        <option key={m} value={String(m).padStart(2, '0')}>
                          {String(m).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {activity.workingHours > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    作業時間: {activity.workingHours.toFixed(2)}時間
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  課題
                </label>
                <textarea
                  value={activity.issues}
                  onChange={(e) =>
                    handleActivityChange(index, 'issues', e.target.value)
                  }
                  onInput={(e) => autoResize(e.currentTarget)}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-gray-900 placeholder:text-gray-400 overflow-hidden"
                  placeholder="この活動に関する課題を記入してください"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={addActivity}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            活動を追加
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="improvements" className="block text-sm font-medium mb-2 text-gray-700">
          改善点・気づき
        </label>
        <textarea
          id="improvements"
          name="improvements"
          value={formData.improvements}
          onChange={handleChange}
          onInput={(e) => autoResize(e.currentTarget)}
          required
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-gray-900 placeholder:text-gray-400 overflow-hidden"
          placeholder="全体的な改善点や気づいたことを記入してください"
        />
      </div>

      <div>
        <label htmlFor="happyMoments" className="block text-sm font-medium mb-2 text-gray-700">
          嬉しかったこと・感動したこと
        </label>
        <textarea
          id="happyMoments"
          name="happyMoments"
          value={formData.happyMoments}
          onChange={handleChange}
          onInput={(e) => autoResize(e.currentTarget)}
          required
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-gray-900 placeholder:text-gray-400 overflow-hidden"
          placeholder="嬉しかったことや感動したことを記入してください"
        />
      </div>

      <div>
        <label htmlFor="futureTasks" className="block text-sm font-medium mb-2 text-gray-700">
          これからのタスク
        </label>
        <textarea
          id="futureTasks"
          name="futureTasks"
          value={formData.futureTasks}
          onChange={handleChange}
          onInput={(e) => autoResize(e.currentTarget)}
          required
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-gray-900 placeholder:text-gray-400 overflow-hidden"
          placeholder="今後のタスクを記入してください"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        {isSubmitting ? '送信中...' : isEditing ? '更新' : '作成'}
      </button>
    </form>
  )
}
