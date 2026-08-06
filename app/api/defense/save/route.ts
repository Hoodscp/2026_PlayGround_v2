import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { DefenseSaveModel } from "@/lib/models/DefenseSave";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get("guestId");

    if (!guestId) {
      return NextResponse.json({ error: "guestId required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ dbConnected: false, saveData: null });
    }

    const doc = await DefenseSaveModel.findOne({ guestId }).lean();
    return NextResponse.json({
      dbConnected: true,
      saveData: doc ? doc.saveData : null,
    });
  } catch (error) {
    console.error("GET /api/defense/save error:", error);
    return NextResponse.json({ error: "Failed to load defense save" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { guestId, saveData } = body;

    if (!guestId || !saveData) {
      return NextResponse.json({ error: "guestId and saveData required" }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({
        dbConnected: false,
        message: "Saved in local browser. MONGODB_URI pending.",
      });
    }

    await DefenseSaveModel.findOneAndUpdate(
      { guestId },
      { saveData, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ dbConnected: true, success: true });
  } catch (error) {
    console.error("POST /api/defense/save error:", error);
    return NextResponse.json({ error: "Failed to sync defense save" }, { status: 500 });
  }
}
