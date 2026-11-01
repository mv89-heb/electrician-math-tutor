import { expect, test } from "@playwright/test";

test("PLC simulator updates virtual outputs and explains the logic in real time", async ({ page }) => {
  await page.goto("/subjects/plc/plc-simulation");

  await expect(page.getByRole("heading", { name: "סימולטור PLC דיגיטלי" })).toBeVisible();
  await expect(page.getByTestId("plc-output-Q0.0")).toContainText("פעילה (1)");
  await expect(page.getByRole("button", { name: "AND · שתי כניסות פעילות" })).toBeVisible();

  await page.getByRole("button", { name: "בדיקת התרגול" }).click();
  await expect(page.getByRole("status")).toContainText("מצוין");

  await page.getByRole("button", { name: /כניסה I0\.1/ }).click();
  await expect(page.getByTestId("plc-output-Q0.0")).toContainText("כבויה (0)");
  await expect(page.getByRole("region", { name: "תהליך הלוגיקה של Q0.0" })).toContainText("AND");

  await page.getByRole("button", { name: "NOT · היפוך כניסה" }).click();
  await page.getByRole("button", { name: "בדיקת התרגול" }).click();
  await expect(page.getByRole("status")).toContainText("מצוין");
  await expect(page.getByTestId("plc-output-Q0.0")).toContainText("פעילה (1)");
  await expect(page.getByText(/אין חיבור לבקר פיזי/)).toBeVisible();
});

test("the PLC simulator leaves existing subject progress untouched", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.setItem("electrician-subject-progress-v1", JSON.stringify({
      version: 1,
      completedUnitIds: ["mathematics:arithmetic-units", "electrical-theory:electrical-quantities"],
      updatedAt: 123,
    }));
  });

  await page.goto("/subjects/plc/plc-simulation");
  await page.getByRole("button", { name: /כניסה I0\.0/ }).click();

  const completedUnitIds = await page.evaluate(() => {
    const raw = window.localStorage.getItem("electrician-subject-progress-v1");
    return raw ? JSON.parse(raw).completedUnitIds : [];
  });
  expect(completedUnitIds).toEqual(["mathematics:arithmetic-units", "electrical-theory:electrical-quantities"]);
});

test("existing Ohm's law and DC circuit labs remain available", async ({ page }) => {
  await page.goto("/subjects/electrical-theory/electrical-quantities");
  await expect(page.getByRole("heading", { name: "משחקים עם חוק אוהם" })).toBeVisible();

  await page.goto("/subjects/electrical-theory/dc-circuits");
  await expect(page.getByRole("heading", { name: "מעגל טורי מול מעגל מקבילי" })).toBeVisible();
  await expect(page.getByRole("button", { name: "חיבור טורי" })).toBeVisible();
});
