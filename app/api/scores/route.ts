import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { GameScoreModel } from "@/lib/models/GameScore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId") || "defense";
    const difficulty = searchParams.get("difficulty");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({
        dbConnected: false,
        message: "MongoDB connection is pending. Please configure MONGODB_URI in environment variables.",
        scores: [],
      });
    }

    const query: Record<string, unknown> = { gameId };
    if (difficulty) {
      query.difficulty = difficulty;
    }

    const scores = await GameScoreModel.find(query)
      .sort({ score: -1, createdAt: 1 })
      .limit(limit)
      .lean();

    const formatted = scores.map((item, index) => ({
      rank: index + 1,
      id: String(item._id),
      guestId: item.guestId,
      nickname: item.nickname,
      gameId: item.gameId,
      difficulty: item.difficulty,
      score: item.score,
      clearTime: item.clearTime,
      wave: item.wave,
      createdAt: item.createdAt,
    }));

    return NextResponse.json({
      dbConnected: true,
      scores: formatted,
    });
  } catch (error) {
    console.error("GET /api/scores error:", error);
    return NextResponse.json(
      { dbConnected: false, error: "Failed to fetch scores", scores: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guestId, nickname, gameId, difficulty, score, clearTime, wave, extraStats } = body;

    if (!guestId || !gameId || typeof score !== "number") {
      return NextResponse.json(
        { error: "Invalid payload: guestId, gameId and score are required" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({
        dbConnected: false,
        message: "Score saved locally. Configure MONGODB_URI to enable global leaderboard.",
      });
    }

    const newScore = await GameScoreModel.create({
      guestId,
      nickname: nickname || "Liquid Blob",
      gameId,
      difficulty: difficulty || "NORMAL",
      score,
      clearTime,
      wave,
      extraStats,
    });

    return NextResponse.json({
      dbConnected: true,
      success: true,
      scoreId: String(newScore._id),
    });
  } catch (error) {
    console.error("POST /api/scores error:", error);
    return NextResponse.json({ error: "Failed to submit score" }, { status: 500 });
  }
}
