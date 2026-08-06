import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { MotionPresetModel } from "@/lib/models/MotionPreset";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json(
        { dbConnected: false, error: "Database not connected" },
        { status: 503 }
      );
    }

    const preset = await MotionPresetModel.findOne({ presetId: id }).lean();
    if (!preset) {
      return NextResponse.json({ error: "Preset not found" }, { status: 404 });
    }

    return NextResponse.json({
      dbConnected: true,
      preset: {
        id: preset.presetId,
        title: preset.title,
        creatorNickname: preset.creatorNickname,
        stdDeviation: preset.stdDeviation,
        matrixValues: preset.matrixValues,
        likes: preset.likes,
        createdAt: preset.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /api/motion/presets/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch preset" }, { status: 500 });
  }
}
