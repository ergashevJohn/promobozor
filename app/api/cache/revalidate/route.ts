import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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
