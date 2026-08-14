export type PromocodeStatus = "draft" | "active" | "expired" | "disabled";

export type Promocode = {
  id: string;
  type?: "code" | "link";
  code: string | null;
  link?: string | null;
  discountType: "percent" | "amount";
  discountValue: number;
  currency?: "UZS" | "USD" | "EUR";
  originalPrice?: number | null;
  imageUrl?: string | null;
  status: PromocodeStatus;
  isFeatured: boolean;
  viewsCount: number;
  copyCount: number;
  likesCount: number;
  dislikesCount: number;
  startsAt?: string | null;
  expiresAt: string | null;
  lastVerifiedAt?: string | null;
  minOrderAmount?: number | null;
  translations: Array<{
    language: string;
    title: string;
    slug: string;
    shortDescription?: string | null;
    conditions?: string | null;
    howToHtml?: string | null;
    editorVerdict?: string | null;
    faqJson?: unknown;
  }>;
  store: Store | null;
  category?: Category | null;
  brand?: Brand | null;
};

export type Store = {
  id?: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  translations: Array<{
    language: string;
    name: string;
    slug: string;
  }>;
};

export type Category = {
  id?: string;
  imageUrl?: string | null;
  translations: Array<{
    language: string;
    name: string;
    slug: string;
  }>;
};

export type Brand = {
  id?: string;
  imageUrl?: string | null;
  websiteUrl?: string | null;
  translations: Array<{
    language: string;
    name: string;
    slug: string;
  }>;
};
