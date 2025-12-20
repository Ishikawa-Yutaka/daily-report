"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminRoute from "@/components/AdminRoute";
import Header from "@/components/Header";

// 招待コード型定義
interface InvitationCode {
  id: string;
  employeeNumber: string;
  isUsed: boolean;
  usedBy: string | null;
  usedAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

export default function InvitationCodesPage() {
  const [invitationCodes, setInvitationCodes] = useState<InvitationCode[]>([]);
  const [newEmployeeNumber, setNewEmployeeNumber] = useState<string>("");
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationError, setInvitationError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvitationCodes();
  }, []);

  // 招待コードを読み込む
  const loadInvitationCodes = async () => {
    try {
      const res = await fetch("/api/admin/invitation-codes", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setInvitationCodes(data);
      }
    } catch (error) {
      console.error("招待コード取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  // 招待コードを発行する
  const handleCreateInvitationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvitationError("");

    if (!newEmployeeNumber.trim()) {
      setInvitationError("社員番号を入力してください");
      return;
    }

    setInvitationLoading(true);

    try {
      const res = await fetch("/api/admin/invitation-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ employeeNumber: newEmployeeNumber.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInvitationError(data.error || "招待コードの発行に失敗しました");
        return;
      }

      // 成功時：リストを再読み込みして入力をクリア
      setNewEmployeeNumber("");
      await loadInvitationCodes();
    } catch (error) {
      console.error("招待コード発行エラー:", error);
      setInvitationError("招待コードの発行に失敗しました");
    } finally {
      setInvitationLoading(false);
    }
  };

  // 招待コードを削除する（未使用のみ）
  const handleDeleteInvitationCode = async (
    id: string,
    employeeNumber: string
  ) => {
    if (!confirm(`社員番号 ${employeeNumber} の招待コードを削除しますか？`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/invitation-codes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "招待コードの削除に失敗しました");
        return;
      }

      // 成功時：リストを再読み込み
      await loadInvitationCodes();
    } catch (error) {
      console.error("招待コード削除エラー:", error);
      alert("招待コードの削除に失敗しました");
    }
  };

  if (loading) {
    return (
      <AdminRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* ヘッダー */}
          <div className="mb-6">
            <Link
              href="/admin"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              管理者ダッシュボードに戻る
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">招待コード管理</h1>
            <p className="mt-2 text-gray-600">
              新しい社員が登録できるように社員番号を発行します。発行された社員番号を使って、社員はアカウントを作成できます。
            </p>
          </div>

          {/* 招待コード発行フォーム */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              新しい招待コードを発行
            </h2>
            <form onSubmit={handleCreateInvitationCode}>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newEmployeeNumber}
                    onChange={(e) => setNewEmployeeNumber(e.target.value)}
                    placeholder="社員番号を入力（例: EMP001）"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                    disabled={invitationLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={invitationLoading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {invitationLoading ? "発行中..." : "発行"}
                </button>
              </div>
              {invitationError && (
                <p className="mt-2 text-sm text-red-600">{invitationError}</p>
              )}
            </form>
          </div>

          {/* 統計情報 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                発行済み
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {invitationCodes.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">未使用</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {invitationCodes.filter((code) => !code.isUsed).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">使用中</h3>
              <p className="text-3xl font-bold text-green-600">
                {invitationCodes.filter((code) => code.isUsed).length}
              </p>
            </div>
          </div>

          {/* 招待コード一覧 */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                招待コード一覧
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      社員番号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      発行日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      使用日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invitationCodes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        招待コードが発行されていません
                      </td>
                    </tr>
                  ) : (
                    invitationCodes.map((code) => (
                      <tr key={code.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {code.employeeNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {code.isUsed ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              使用済み
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              未使用
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(code.createdAt).toLocaleString("ja-JP")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {code.usedAt
                            ? new Date(code.usedAt).toLocaleString("ja-JP")
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {!code.isUsed && (
                            <button
                              onClick={() =>
                                handleDeleteInvitationCode(
                                  code.id,
                                  code.employeeNumber
                                )
                              }
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              削除
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
