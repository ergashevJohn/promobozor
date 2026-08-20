import { NextResponse } from "next/server";

/** Historical endpoint retained so old clients receive an explicit retirement response. */
export async function POST() {
  return NextResponse.json(
    { error: "Like/dislike ratings have been retired. Use promocode feedback instead." },
    { status: 410 }
  );
}
