import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, cities, meetingUrl } = body;

  if (!title || !cities || !Array.isArray(cities) || !meetingUrl) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const meetingId = meetingUrl.split('/').pop(); 

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

export async function GET(req: NextRequest) {
  const meetingId = req.nextUrl.searchParams.get('meetingId');
  if (!meetingId) {
    return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db();
  const meeting = await db.collection('meetings').findOne({ meetingId });
  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }
  // Remove MongoDB _id from response for cleaner output
  const { _id, ...meetingData } = meeting;
  return NextResponse.json(meetingData);
}
