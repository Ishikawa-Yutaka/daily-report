// 期間プリセットの種類
export type DatePreset = "all" | "today" | "week" | "month" | "quarter" | "custom";

/**
 * 期間プリセットに基づいて開始日と終了日を計算する関数
 *
 * この関数は社員側と管理者側の両方で使用され、日報の期間フィルタリングに利用されます。
 *
 * @param preset - 期間プリセット（all, today, week, month, quarter, custom）
 *   - all: すべての期間（フィルターなし）
 *   - today: 今日のみ
 *   - week: 今週（月曜日から日曜日）
 *   - month: 今月（1日から月末）
 *   - quarter: 今四半期（1-3月、4-6月、7-9月、10-12月）
 *   - custom: カスタム期間（customStart, customEndで指定）
 *
 * @param customStart - カスタム開始日（preset="custom"の場合に使用、YYYY-MM-DD形式）
 * @param customEnd - カスタム終了日（preset="custom"の場合に使用、YYYY-MM-DD形式）
 *
 * @returns {startDate, endDate} - ISO形式の日付文字列（YYYY-MM-DD）、またはnull
 *
 * @example
 * // 今週の期間を取得
 * const { startDate, endDate } = getDateRange("week", "", "");
 * // startDate: "2025-12-01" (月曜日), endDate: "2025-12-07" (日曜日)
 *
 * @example
 * // カスタム期間を取得
 * const { startDate, endDate } = getDateRange("custom", "2025-12-01", "2025-12-31");
 * // startDate: "2025-12-01", endDate: "2025-12-31"
 */
export function getDateRange(
  preset: DatePreset,
  customStart: string,
  customEnd: string
): { startDate: string | null; endDate: string | null } {
  // 今日の日付を取得（時刻を00:00:00に設定）
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (preset) {
    case "all":
      // すべての期間を表示（フィルターなし）
      return { startDate: null, endDate: null };

    case "today":
      // 今日のみ
      return {
        startDate: today.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
      };

    case "week": {
      // 今週（月曜日から日曜日）
      const dayOfWeek = today.getDay(); // 0=日曜, 1=月曜, ..., 6=土曜
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 月曜日への日数オフセット
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return {
        startDate: monday.toISOString().split("T")[0],
        endDate: sunday.toISOString().split("T")[0],
      };
    }

    case "month": {
      // 今月（1日から月末）
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      return {
        startDate: firstDay.toISOString().split("T")[0],
        endDate: lastDay.toISOString().split("T")[0],
      };
    }

    case "quarter": {
      // 今四半期（1-3月、4-6月、7-9月、10-12月）
      const currentMonth = today.getMonth(); // 0-11
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3; // 0, 3, 6, 9
      const firstDay = new Date(today.getFullYear(), quarterStartMonth, 1);
      const lastDay = new Date(today.getFullYear(), quarterStartMonth + 3, 0);

      return {
        startDate: firstDay.toISOString().split("T")[0],
        endDate: lastDay.toISOString().split("T")[0],
      };
    }

    case "custom":
      // カスタム期間
      return {
        startDate: customStart || null,
        endDate: customEnd || null,
      };

    default:
      return { startDate: null, endDate: null };
  }
}
