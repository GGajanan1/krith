import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, cities } = body;

  if (!title || !cities || !Array.isArray(cities)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();
  const result = await db.collection("meetings").insertOne({
    title,
    description,
    cities,
    createdAt: new Date(),
  });

  return NextResponse.json({ id: result.insertedId });
}

export async function GET(req: NextRequest) {
  // For fetching all meetings (optional)
  const client = await clientPromise;
  const db = client.db();
  const meetings = await db.collection("meetings").find({}).toArray();
  return NextResponse.json(meetings);
}