import { expect, test } from "@playwright/test";
import sharp from "sharp";

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
  await page.getByRole("button", { name: "Open", exact: true }).first().click();
  await expect(page.getByText("Immutable audit timeline")).toBeVisible();
  await expect(page.getByText("Case created")).toBeVisible();
  await expect(page.getByText("Automated checks completed")).toBeVisible();
  await expect(page.getByText("Human decision required")).toBeVisible();
});

test("bilingual, attribute, and photo search narrow listings", async ({ page }) => {
  await page.goto("/marketplace");
  const search = page.getByPlaceholder("Search in English or မြန်မာ Unicode…");
  await search.fill("ဖုန်း");
  await expect(page.getByText("iPhone 13 · 128 GB")).toBeVisible();
  await expect(page.getByText("Fujifilm X100V")).toHaveCount(0);

  await search.fill("");
  await page.getByRole("button", { name: "Filters" }).click();
  await page.getByLabel("Condition tier").selectOption("Like New");
  await page.getByLabel("Transaction type").selectOption("SafeZone Locker Pickup");
  await page.getByLabel("Seller credibility").selectOption("High Response Rate (<15 mins)");
  await page.getByLabel("Price & bargain").selectOption("Open to Offers");
  await expect(page.getByText("iPhone 13 · 128 GB")).toBeVisible();
  await expect(page.getByText("MacBook Air M2")).toHaveCount(0);

  await page.getByLabel("Condition tier").selectOption("All");
  await page.getByLabel("Transaction type").selectOption("All");
  await page.getByLabel("Seller credibility").selectOption("All");
  await page.getByLabel("Price & bargain").selectOption("All");
  await page.locator('input[type="file"]').setInputFiles({
    name: "iphone.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
  });
  await expect(page.getByText(/similar listings/)).toBeVisible();
  await expect(page.getByText("iPhone 13 · 128 GB")).toBeVisible();
});

test("seller selection reopens waiting buyers after expiry or cancellation", async ({ page }) => {
  await page.goto("/offers");
  const nway = page.locator("article").filter({ hasText: "Nway Oo" });
  await nway.getByRole("button", { name: "Choose buyer" }).click();
  await expect(page.getByText(/Everyone else moved to Waiting/)).toBeVisible();
  await page.getByRole("button", { name: "Simulate 24h expiry" }).click();
  await expect(page.getByText(/Waiting buyers are available again/)).toBeVisible();

  const min = page.locator("article").filter({ hasText: "Min Zaw" });
  await min.getByRole("button", { name: "Choose buyer" }).click();
  await page.getByRole("button", { name: "Buyer cancels" }).click();
  await expect(page.getByText(/cancelled by buyer/)).toBeVisible();
  const kyaw = page.locator("article").filter({ hasText: "Kyaw Thu" });
  await expect(kyaw.getByRole("button", { name: "Choose buyer" })).toBeVisible();
});

test("chat lives on the marketplace seller tab and stays empty until someone is messaged", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Chat" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Chat" })).toHaveCount(0);
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("navigation", { name: "Side menu" }).getByRole("link", { name: "Chat" })).toHaveCount(0);
  await page.getByRole("dialog", { name: "Side menu" }).getByLabel("Close menu").click();

  await page.goto("/marketplace");
  await page.getByRole("navigation", { name: "Marketplace sections" }).getByRole("link", { name: "Seller" }).click();
  await expect(page.getByRole("heading", { name: "No chats yet" })).toBeVisible();

  await page.goto("/marketplace/iphone-13");
  await page.getByRole("link", { name: "Message seller" }).click();
  await expect(page.getByRole("heading", { name: "May Thiri" })).toBeVisible();
  await page.getByPlaceholder("Message safely…").fill("Is the battery health still 91%?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Is the battery health still 91%?")).toBeVisible();

  await page.goto("/marketplace?tab=seller");
  await expect(page.getByRole("heading", { name: "No chats yet" })).toHaveCount(0);
  await page.getByRole("link", { name: /May Thiri/ }).click();
  await expect(page.getByText("Is the battery health still 91%?")).toBeVisible();
});

test("seller receives a dynamically watermarked photo derivative", async ({ page }) => {
  const source = await sharp({ create: { width: 400, height: 300, channels: 3, background: "#4d7c5c" } }).png().toBuffer();
  await page.goto("/sell");
  await page.getByRole("button", { name: "2. Evidence" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "phone.png",
    mimeType: "image/png",
    buffer: source,
  });
  await expect(page.getByText("Protected preview ready")).toBeVisible();
  await expect(page.getByText(/Protected for @May Thiri/)).toBeVisible();
  await expect(page.getByAltText("Dynamically watermarked listing preview")).toBeVisible();
});
