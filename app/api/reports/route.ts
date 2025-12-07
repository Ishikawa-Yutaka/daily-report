import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // 認証チェック
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // クエリパラメータから期間フィルター条件を取得
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // フィルター条件を構築
    const where: any = {
      userId: user.userId,
    };

    // 期間フィルターを適用
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // ログインユーザーの日報のみ取得
    const reports = await prisma.dailyReport.findMany({
      where,
      include: {
        activities: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
    return NextResponse.json(reports);
  } catch (error) {
    console.error("レポート取得エラー:", error);
    return NextResponse.json(
      { error: "レポートの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 認証チェック
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const {
      date,
      dailyGoal,
      improvements,
      happyMoments,
      futureTasks,
      activities,
    } = body;

    // 日付を正規化（時刻を00:00:00に設定）
    const reportDate = new Date(date);
    reportDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(reportDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // 同じユーザーが同じ日付の日報を既に作成していないかチェック
    const existingReport = await prisma.dailyReport.findFirst({
      where: {
        userId: user.userId,
        date: {
          gte: reportDate,
          lt: nextDay,
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "この日付の日報は既に作成されています" },
        { status: 409 }
      );
    }

    // ログインユーザーの日報として作成
    const report = await prisma.dailyReport.create({
      data: {
        date: new Date(date),
        dailyGoal,
        improvements,
        happyMoments,
        futureTasks,
        userId: user.userId, // ログインユーザーのIDを使用
        activities: {
          create: activities.map((activity: any, index: number) => ({
            projectCategory: activity.projectCategory,
            content: activity.content,
            workingHours: activity.workingHours,
            startTime: activity.startTime || null,
            endTime: activity.endTime || null,
            issues: activity.issues,
            order: index,
          })),
        },
      },
      include: {
        activities: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("レポート作成エラー:", error);
    return NextResponse.json(
      { error: "レポートの作成に失敗しました" },
      { status: 500 }
    );
  }
}
