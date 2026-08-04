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
  translations: Array<{
    language: string;
    title: string;
    slug: string;
    conditions?: string | null;
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
