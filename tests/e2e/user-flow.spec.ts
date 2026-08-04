import { expect, test } from "@playwright/test";
import { clickHeaderNavLink, gotoHome } from "./helpers";

test.describe("User Flow Tests", () => {
  test("navigate through main categories and stores", async ({ page }) => {
    test.slow();

    await gotoHome(page);

    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    await clickHeaderNavLink(page, "stores");
    await expect(page).toHaveURL(/\/stores/, { timeout: 10000 });

    await gotoHome(page);
    await clickHeaderNavLink(page, "categories");
    await expect(page).toHaveURL(/\/categories/, { timeout: 10000 });

    await gotoHome(page);

    const languageSelector = page.locator("select#language-selector");
    if (await languageSelector.isVisible()) {
      await languageSelector.selectOption("ru");
      await expect(page).toHaveURL(/\/ru/, { timeout: 10000 });

      await languageSelector.selectOption("uz");
      await expect(page).toHaveURL(/\/uz/, { timeout: 10000 });
    }
  });

  test("promocode interaction", async ({ page }) => {
    test.slow();

    await page.goto("/uz/promocodes");
    await expect(page).toHaveURL(/\/promocodes/);

    const promocodeDetailLink = page.locator('main a[href*="/promocode/"]').first();
    const hasPromocodes = await promocodeDetailLink
      .isVisible({ timeout: 20000 })
      .catch(() => false);

    test.skip(!hasPromocodes, "No promocodes available in the database");

    await promocodeDetailLink.click();
    await expect(page).toHaveURL(/\/promocode\/.+/, { timeout: 15000 });

    const actionButton = page
      .locator("button")
      .filter({
        hasText: /nusxa|copy|копир|activat|faollashtir|активир|expired|tugagan|get deal|batafsil/i,
      })
      .first();

    await expect(actionButton).toBeVisible();
  });
});
