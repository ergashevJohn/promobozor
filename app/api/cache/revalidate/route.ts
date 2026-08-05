import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed in production; allow in local dev without secret for convenience
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = request.headers.get("x-revalidate-secret");

  return bearer === secret || headerSecret === secret;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const tag = searchParams.get("tag");

    if (tag) {
      revalidateTag(tag, {});
      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        message: `Kesh '${tag}' uchun tozalandi.`,
      });
    }

    // Revalidate all standard cached tags
    const defaultTags = ["promocodes", "categories", "stores", "brands", "all"];
    defaultTags.forEach((t) => revalidateTag(t, {}));

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: "Saytdagi barcha asosiy keshlar tozalandi (promokodlar, kategoriyalar, do'konlar).",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Xatolik ro'y berdi" }, { status: 500 });
  }
}
