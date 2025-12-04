"use client";

import { DailyReport } from "@/types/daily-report";
import Link from "next/link";

interface DailyReportListProps {
  reports: DailyReport[];
}

export default function DailyReportList({ reports }: DailyReportListProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <div className="space-y-4">
      {reports.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">まだ日報がありません</p>
          <Link
            href="/reports/new"
            className="inline-block mt-4 text-blue-500 hover:text-blue-600"
          >
            最初の日報を作成する
          </Link>
        </div>
      ) : (
        reports.map((report) => (
          <Link
            key={report.id}
            href={`/reports/${report.id}`}
            className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {formatDate(report.date)}
              </h3>
              <span className="text-sm text-gray-500">
                {new Date(report.updatedAt).toLocaleDateString("ja-JP")}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">本日の目標: </span>
                <span className="text-gray-600 line-clamp-1">
                  {report.quarterlyGoal}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">活動件数: </span>
                <span className="text-gray-600">
                  {report.activities.length}件
                </span>
                <span className="ml-2 text-gray-700">合計稼働時間: </span>
                <span className="text-gray-600">
                  {report.activities
                    .reduce((sum, a) => sum + a.workingHours, 0)
                    .toFixed(1)}
                  時間
                </span>
              </div>
              {report.activities.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">主な活動: </span>
                  <span className="text-gray-600 line-clamp-1">
                    {report.activities[0].projectCategory}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
