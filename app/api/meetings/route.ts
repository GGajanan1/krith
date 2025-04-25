import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, cities, meetingUrl } = body;

  if (!title || !cities || !Array.isArray(cities) || !meetingUrl) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const meetingId = meetingUrl.split('/').pop(); // Extract meeting ID from the URL

  const client = await clientPromise;
  const db = client.db(); // Defaults to 'krithathon' as per your URI
  const result = await db.collection("meetings").insertOne({
    title,
    description,
    cities,
    meetingUrl,
    meetingId,
    totalDistricts: cities.length,
    createdAt: new Date(),
  });

  return NextResponse.json({ id: result.insertedId });
}
