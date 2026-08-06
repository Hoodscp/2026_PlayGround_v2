import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let { guestId, nickname } = body;

    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    if (!nickname) {
      nickname = `Blob_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({
        dbConnected: false,
        user: { guestId, nickname },
      });
    }

    let user = await UserModel.findOne({ guestId });
    if (!user) {
      user = await UserModel.create({
        guestId,
        nickname,
      });
    }

    return NextResponse.json({
      dbConnected: true,
      user: {
        guestId: user.guestId,
        nickname: user.nickname,
      },
    });
  } catch (error) {
    console.error("POST /api/user/guest error:", error);
    return NextResponse.json({ error: "Failed to resolve guest user" }, { status: 500 });
  }
}
