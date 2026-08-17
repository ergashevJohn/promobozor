import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { blogPosts } from "@/lib/blog";
import { BlogPostDetail } from "./BlogPostDetail";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}));

describe("BlogPostDetail", () => {
  it("shows the confirmed author identity with an About page link", () => {
    render(
      <BlogPostDetail
        post={blogPosts[0]}
        locale="uz"
        labels={{
          updated: "Yangilangan",
          published: "Chop etilgan",
          authorBy: "Muallif",
          authorName: "Jahongir Ergashev",
          authorRole: "PromoBozor asoschisi va muharriri",
          readingTime: "3 daqiqa o‘qish",
          verifiedBadge: "Tekshirilgan",
          verifiedHint: "Shartlar yangilanadi.",
          backToBlog: "Blogga qaytish",
          relatedArticles: "Boshqa qo‘llanmalar",
          relatedArticlesDescription: "Amaliy maqolalar.",
          quickLinks: "Tezkor havolalar",
          stepsLabel: "Qadamlar",
          relatedStore: "Do‘kon hubiga o‘tish",
          relatedBrand: "Brend hubiga o‘tish",
          allOffers: "Barcha takliflar",
          readMore: "Davomini o‘qish",
          guideTag: "Qo‘llanma",
          storeGuideTag: "Do‘kon",
          brandGuideTag: "Brend",
        }}
      />
    );

    expect(screen.getByRole("link", { name: "Jahongir Ergashev" })).toHaveAttribute(
      "href",
      "/about"
    );
    expect(screen.getByText(/Muallif/).parentElement).toHaveTextContent(
      "PromoBozor asoschisi va muharriri"
    );
  });
});
