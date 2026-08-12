import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { secureCompare } from "@/lib/secure-compare";

const defaultTags = ["promocodes", "categories", "stores", "brands", "all"];

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    // Fail closed in production; allow in local dev without secret for convenience
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = request.headers.get("x-revalidate-secret");

  return secureCompare(bearer, secret) || secureCompare(headerSecret, secret);
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const rawTag = searchParams.get("tag");
    // Bound tag length to avoid abuse of cache tag namespace
    const tag = rawTag && rawTag.length <= 64 ? rawTag : null;

    if (rawTag && !tag) {
      return NextResponse.json({ error: "Invalid tag" }, { status: 400 });
    }

    if (tag) {
      revalidateTag(tag, {});
      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        message: `Kesh '${tag}' uchun tozalandi.`,
      });
    }

    // Revalidate all standard cached tags
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
