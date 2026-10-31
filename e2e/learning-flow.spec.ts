import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.removeItem("electrician-subject-progress-v1");
  });
});

test("homepage starts learning without a placement test", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: /מתחילים מהבסיס/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /להתחיל ללמוד/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /מבחן מיון|מבחן כניסה/ })).toHaveCount(0);
});

test("only one responsive primary navigation is visible", async ({ page }) => {
  await page.goto("/");
  const visiblePrimaryNavigation = page.locator('nav[aria-label="ניווט ראשי"]:visible');
  await expect(visiblePrimaryNavigation).toHaveCount(1);
  await expect(visiblePrimaryNavigation.getByRole("link").first()).toBeVisible();
});

test("lesson category link returns to the matching subject category", async ({ page }) => {
  await page.goto("/subjects/mathematics/arithmetic-units");
  await expect(page.getByRole("heading", { name: "מספרים ויחידות שמדברים בשפת החשמל" })).toBeVisible();

  await page.getByRole("link", { name: /מפת המקצועות/ }).click();

  await expect(page).toHaveURL(/\/subjects#foundations$/);
  await expect(page.getByRole("button", { name: "מקצועות יסוד ומדעים" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "מתמטיקה שימושית לחשמל" })).toBeVisible();
});

test("a unit is completed only after a correct answer and completion persists", async ({ page }) => {
  await page.goto("/subjects/mathematics/arithmetic-units");

  await page.getByRole("button", { name: "א. 0.075A" }).click();
  await page.getByRole("button", { name: "בדיקת התשובה" }).click();
  await expect(page.getByRole("status")).toContainText("עדיין לא");
  await expect(page.getByRole("button", { name: "יש לענות נכון על בדיקת ההבנה תחילה" })).toBeDisabled();

  await page.getByRole("button", { name: "ב. 0.75A" }).click();
  await page.getByRole("button", { name: "בדיקת התשובה" }).click();
  await expect(page.getByRole("status")).toContainText("מצוין!");
  await page.getByRole("button", { name: "סמן יחידה כהושלמה" }).click();
  await expect(page.getByText("היחידה סומנה כהושלמה.")).toBeVisible();

  await page.reload();
  await expect(page.getByText("היחידה סומנה כהושלמה.")).toBeVisible();
  await expect(page.getByRole("button", { name: "הסר סימון השלמה" })).toBeEnabled();
});
