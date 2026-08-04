import { expect, test } from "@playwright/test";
import { gotoHome } from "./helpers";

test("has title", async ({ page }) => {
  await gotoHome(page);

  await expect(page).toHaveTitle(/PromoBozor/i);
});

test("check main elements", async ({ page }) => {
  await gotoHome(page);

  const header = page.locator("header");
  await expect(header).toBeVisible();
});
