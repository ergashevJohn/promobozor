import { expect, type Page } from "@playwright/test";

const NAV_LINKS = {
  stores: /stores|do'konlar|магазины/i,
  categories: /categories|kategoriyalar|категор/i,
} as const;

export async function gotoHome(page: Page) {
  await page.goto("/uz");
  await expect(page).toHaveURL(/\/uz\/?$/);
}

export async function clickHeaderNavLink(page: Page, link: keyof typeof NAV_LINKS) {
  const nav = page.getByRole("banner").getByRole("navigation").first();
  const navLink = nav.getByRole("link", { name: NAV_LINKS[link] });

  await expect(navLink).toBeVisible();
  await Promise.all([page.waitForURL(new RegExp(`/${link}`)), navLink.click()]);
}
