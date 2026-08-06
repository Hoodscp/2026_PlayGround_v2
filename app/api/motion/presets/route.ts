import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { MotionPresetModel } from "@/lib/models/MotionPreset";

export async function GET() {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({
        dbConnected: false,
        presets: [],
        message: "MongoDB connection pending.",
      });
    }

    const presets = await MotionPresetModel.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const formatted = presets.map((p) => ({
      id: p.presetId,
      title: p.title,
      creatorNickname: p.creatorNickname,
      stdDeviation: p.stdDeviation,
      matrixValues: p.matrixValues,
      likes: p.likes,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({
      dbConnected: true,
      presets: formatted,
    });
  } catch (error) {
    console.error("GET /api/motion/presets error:", error);
    return NextResponse.json({ error: "Failed to fetch presets", presets: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, creatorNickname, stdDeviation, matrixValues } = body;

    if (!title || typeof stdDeviation !== "number" || !Array.isArray(matrixValues)) {
      return NextResponse.json({ error: "Invalid preset payload" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({
        dbConnected: false,
        message: "Preset saved in local browser only. Configure MONGODB_URI to share online.",
      });
    }

    const presetId = `preset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newPreset = await MotionPresetModel.create({
      presetId,
      title,
      creatorNickname: creatorNickname || "Liquid Artist",
      stdDeviation,
      matrixValues,
    });

    return NextResponse.json({
      dbConnected: true,
      success: true,
      presetId: newPreset.presetId,
    });
  } catch (error) {
    console.error("POST /api/motion/presets error:", error);
    return NextResponse.json({ error: "Failed to save preset" }, { status: 500 });
  }
}
