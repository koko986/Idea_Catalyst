import { expect, test } from "@playwright/test";

test("buyer completes the protected marketplace journey", async ({ page }) => {
  await page.goto("/marketplace");
  await expect(page.getByRole("heading", { name: /Find your next good thing/ })).toBeVisible();
  await page.getByRole("button", { name: "Phones" }).click();
  await expect(page.getByText("iPhone 13 · 128 GB")).toBeVisible();
  await expect(page.getByText("Fujifilm X100V")).toHaveCount(0);

  await page.getByRole("link", { name: /iPhone 13 · 128 GB/ }).click();
  await page.getByRole("button", { name: "Secure in escrow" }).click();
  await expect(page.getByText(/reserved securely/)).toBeVisible();

  await page.getByRole("link", { name: "Message seller" }).click();
  await page.getByPlaceholder("Message safely…").fill("send it to my KPay number");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText(/Possible off-platform contact/)).toBeVisible();

  await page.goto("/orders");
  await page.getByRole("button", { name: "Show single-use pickup QR" }).click();
  await expect(page.getByText(/Expires in/)).toBeVisible();
  await page.getByRole("button", { name: "I approve this item" }).click();
  await expect(page.getByText("Buyer confirmed")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmation recorded" })).toBeDisabled();
});

test("admin queue exposes immutable evidence history", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("button", { name: "Open" }).first().click();
  await expect(page.getByText("Immutable audit timeline")).toBeVisible();
  await expect(page.getByText("Case created")).toBeVisible();
  await expect(page.getByText("Automated checks completed")).toBeVisible();
  await expect(page.getByText("Human decision required")).toBeVisible();
});
