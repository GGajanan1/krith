import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { meetingId, name, empid, desg, city } = body;

  if (!meetingId || !name || !empid || !desg) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();
  const result = await db.collection("meetingRequests").insertOne({
    meetingId,
    name,
    empid,
    desg,
    city,
    status: "pending",
    createdAt: new Date(),
  });

  // Optionally, notify admin here (e.g., via email or websocket)

  return NextResponse.json({ id: result.insertedId });
}