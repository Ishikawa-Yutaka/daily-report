"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import DailyReportList from "@/components/DailyReportList";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import { DailyReport } from "@/types/daily-report";

type SortOption =
  | "date-desc"
  | "date-asc"
  | "updated-desc"
  | "updated-asc"
  | "hours-desc"
  | "hours-asc";

export default function Home() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await fetch("/api/reports", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (error) {
      console.error("レポート取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  // 利用可能なプロジェクト一覧を取得
  const availableProjects = useMemo(() => {
    const projects = new Set<string>();
    reports.forEach((report) => {
      report.activities.forEach((activity) => {
        if (activity.projectCategory) {
          projects.add(activity.projectCategory);
        }
      });
    });
    return Array.from(projects).sort();
  }, [reports]);

  // フィルター・検索・並び替えを適用
  const filteredAndSortedReports = useMemo(() => {
    let filtered = [...reports];

    // キーワード検索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();
      filtered = filtered.filter((report) => {
        // 日報の基本情報を検索
        const matchesBasicInfo =
          report.dailyGoal.toLowerCase().includes(keyword) ||
          report.improvements.toLowerCase().includes(keyword) ||
          report.happyMoments.toLowerCase().includes(keyword) ||
          report.futureTasks.toLowerCase().includes(keyword);

        // 活動セクションを検索
        const matchesActivities = report.activities.some(
          (activity) =>
            activity.projectCategory.toLowerCase().includes(keyword) ||
            activity.content.toLowerCase().includes(keyword) ||
            activity.issues.toLowerCase().includes(keyword)
        );

        return matchesBasicInfo || matchesActivities;
      });
    }

    // プロジェクトフィルター
    if (selectedProjects.length > 0) {
      filtered = filtered.filter((report) =>
        report.activities.some((activity) =>
          selectedProjects.includes(activity.projectCategory)
        )
      );
    }

    // 並び替え
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "updated-desc":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "updated-asc":
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );
        case "hours-desc": {
          const hoursA = a.activities.reduce(
            (sum, act) => sum + act.workingHours,
            0
          );
          const hoursB = b.activities.reduce(
            (sum, act) => sum + act.workingHours,
            0
          );
          return hoursB - hoursA;
        }
        case "hours-asc": {
          const hoursA = a.activities.reduce(
            (sum, act) => sum + act.workingHours,
            0
          );
          const hoursB = b.activities.reduce(
            (sum, act) => sum + act.workingHours,
            0
          );
          return hoursA - hoursB;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [reports, searchKeyword, selectedProjects, sortOption]);

  const handleProjectToggle = (project: string) => {
    setSelectedProjects((prev) =>
      prev.includes(project)
        ? prev.filter((p) => p !== project)
        : [...prev, project]
    );
  };

  const handleResetFilters = () => {
    setSearchKeyword("");
    setSelectedProjects([]);
    setSortOption("date-desc");
  };

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
              {/* 検索・フィルターセクション */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  検索・フィルター
                </h2>

                {/* キーワード検索 */}
                <div className="mb-4">
                  <label
                    htmlFor="search"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    キーワード検索
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="search"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      placeholder="本日の目標、活動内容、課題などを検索..."
                      className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                    />
                    {searchKeyword && (
                      <button
                        onClick={() => setSearchKeyword("")}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        aria-label="検索をクリア"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* プロジェクトフィルター */}
                {availableProjects.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      プロジェクト/カテゴリー
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableProjects.map((project) => (
                        <button
                          key={project}
                          onClick={() => handleProjectToggle(project)}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            selectedProjects.includes(project)
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {project}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 並び替え */}
                <div className="mb-4">
                  <label
                    htmlFor="sort"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    並び替え
                  </label>
                  <select
                    id="sort"
                    value={sortOption}
                    onChange={(e) =>
                      setSortOption(e.target.value as SortOption)
                    }
                    className="w-full md:w-auto border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    <option value="date-desc">日付（新しい順）</option>
                    <option value="date-asc">日付（古い順）</option>
                    <option value="updated-desc">更新日時（新しい順）</option>
                    <option value="updated-asc">更新日時（古い順）</option>
                    <option value="hours-desc">稼働時間（多い順）</option>
                    <option value="hours-asc">稼働時間（少ない順）</option>
                  </select>
                </div>

                {/* フィルターリセット & 結果件数 */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {filteredAndSortedReports.length}件の日報が表示されています
                    {reports.length !== filteredAndSortedReports.length && (
                      <span className="ml-2 text-gray-500">
                        （全{reports.length}件中）
                      </span>
                    )}
                  </div>
                  {(searchKeyword ||
                    selectedProjects.length > 0 ||
                    sortOption !== "date-desc") && (
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium"
                    >
                      リセット
                    </button>
                  )}
                </div>
              </div>

              {/* 日報一覧 */}
              <DailyReportList reports={filteredAndSortedReports} />

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
  );
}
