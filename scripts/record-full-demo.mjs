#!/usr/bin/env node

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const outputDir = path.join(root, ".demo-recording");
const baseUrl = process.env.DEMO_BASE_URL ?? "http://localhost:3000";
const timeline = [];
const startedAt = Date.now();

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const elapsed = () => Number(((Date.now() - startedAt) / 1000).toFixed(2));

async function installDemoLayer(page) {
  await page.evaluate(() => {
    if (document.querySelector("#pyanthit-demo-layer")) return;
    const style = document.createElement("style");
    style.dataset.demo = "pyanthit";
    style.textContent = `
      #pyanthit-demo-layer { position: fixed; inset: 0; z-index: 2147483646; pointer-events: none; font-family: Arial, sans-serif; }
      #pyanthit-demo-card {
        position: absolute; left: 42px; bottom: 42px; width: min(600px, calc(100vw - 84px));
        padding: 22px 24px; color: white; background: rgba(7, 27, 20, .94);
        border: 1px solid rgba(216, 242, 91, .35); border-radius: 18px;
        box-shadow: 0 24px 70px rgba(0, 0, 0, .3); opacity: 0; transform: translateY(18px);
        transition: opacity .35s ease, transform .35s ease; backdrop-filter: blur(18px);
      }
      #pyanthit-demo-card.visible { opacity: 1; transform: translateY(0); }
      #pyanthit-demo-kicker { color: #d8f25b; font-size: 11px; font-weight: 900; letter-spacing: .16em; text-transform: uppercase; }
      #pyanthit-demo-title { margin-top: 9px; font-size: 27px; line-height: 1.05; font-weight: 900; letter-spacing: -.04em; }
      #pyanthit-demo-subtitle { margin-top: 8px; color: rgba(255, 255, 255, .7); font-size: 14px; line-height: 1.45; }
      #pyanthit-demo-cursor {
        position: absolute; left: 0; top: 0; width: 24px; height: 24px; border: 3px solid #d8f25b;
        border-radius: 50%; background: rgba(20, 92, 63, .25); box-shadow: 0 0 0 4px rgba(7, 27, 20, .3);
        transform: translate(-100px, -100px); transition: transform .35s cubic-bezier(.2,.8,.2,1);
      }
      #pyanthit-demo-cursor.clicking { animation: pyanthit-click .45s ease; }
      @keyframes pyanthit-click { 50% { width: 40px; height: 40px; margin: -8px; background: rgba(216, 242, 91, .42); } }
    `;
    document.head.append(style);

    const layer = document.createElement("div");
    layer.id = "pyanthit-demo-layer";
    layer.innerHTML = `
      <div id="pyanthit-demo-card">
        <div id="pyanthit-demo-kicker">PyanThit · Live product demo</div>
        <div id="pyanthit-demo-title"></div>
        <div id="pyanthit-demo-subtitle"></div>
      </div>
      <div id="pyanthit-demo-cursor"></div>
    `;
    document.body.append(layer);
  });
}

async function chapter(page, title, subtitle, narration) {
  await installDemoLayer(page);
  timeline.push({ start: elapsed(), title, narration });
  await page.evaluate(
    ({ titleText, subtitleText }) => {
      const card = document.querySelector("#pyanthit-demo-card");
      document.querySelector("#pyanthit-demo-title").textContent = titleText;
      document.querySelector("#pyanthit-demo-subtitle").textContent = subtitleText;
      card.classList.add("visible");
    },
    { titleText: title, subtitleText: subtitle },
  );
  await sleep(3000);
  await page.evaluate(() => document.querySelector("#pyanthit-demo-card")?.classList.remove("visible"));
  await sleep(550);
}

async function moveAndClick(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (box) {
    await installDemoLayer(page);
    await page.evaluate(
      ({ x, y }) => {
        const cursor = document.querySelector("#pyanthit-demo-cursor");
        cursor.style.transform = `translate(${x - 12}px, ${y - 12}px)`;
      },
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    );
    await sleep(500);
    await page.evaluate(() => document.querySelector("#pyanthit-demo-cursor")?.classList.add("clicking"));
  }
  await locator.click();
  await sleep(650);
  await page.evaluate(() => document.querySelector("#pyanthit-demo-cursor")?.classList.remove("clicking")).catch(() => {});
}

async function goto(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await installDemoLayer(page);
  await sleep(800);
}

async function show(page, locator, milliseconds = 1800) {
  await locator.scrollIntoViewIfNeeded();
  await sleep(milliseconds);
}

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: outputDir, size: { width: 1440, height: 900 } },
  colorScheme: "light",
});
const page = await context.newPage();
const video = page.video();

try {
  await goto(page, "/");
  await chapter(
    page,
    "Second-hand, first-choice.",
    "A trust-first marketplace designed for real buying and selling in Myanmar.",
    "PyanThit is a mobile-first second-hand marketplace for Myanmar. It replaces blind trust with verified identity, protected payment, and evidence at every step.",
  );
  await show(page, page.getByText("Both confirm. We release."));

  await goto(page, "/marketplace");
  await chapter(
    page,
    "Search that understands local buyers",
    "English, Myanmar Unicode, precise filters, and visual similarity.",
    "Buyers can search in English or Myanmar Unicode, filter by condition, handover type, seller credibility, and bargain status, or upload a photo to find visually similar items.",
  );
  const search = page.getByPlaceholder("Search in English or မြန်မာ Unicode…");
  await search.fill("ဖုန်း");
  await sleep(1400);
  await search.fill("");
  await moveAndClick(page, page.getByRole("button", { name: "Filters" }));
  await page.getByLabel("Condition tier").selectOption("Like New");
  await page.getByLabel("Transaction type").selectOption("SafeZone Locker Pickup");
  await page.getByLabel("Seller credibility").selectOption("High Response Rate (<15 mins)");
  await page.getByLabel("Price & bargain").selectOption("Open to Offers");
  await sleep(1800);
  await page.getByLabel("Condition tier").selectOption("All");
  await page.getByLabel("Transaction type").selectOption("All");
  await page.getByLabel("Seller credibility").selectOption("All");
  await page.getByLabel("Price & bargain").selectOption("All");
  await page.locator('input[type="file"]').setInputFiles({
    name: "reference-phone.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByText(/similar listings/).waitFor();
  await sleep(1900);

  await goto(page, "/marketplace/iphone-13");
  await chapter(
    page,
    "Trust before checkout",
    "Verified seller, IMEI checks, condition evidence, transparent trials.",
    "Each listing makes risk visible before checkout. This phone includes a verified seller, advisory condition signals, IMEI controls, protected handover, and a forty-eight-hour trial.",
  );
  await show(page, page.getByRole("button", { name: "Secure in escrow" }));
  await moveAndClick(page, page.getByRole("button", { name: "Secure in escrow" }));
  await show(page, page.getByText(/reserved securely/), 1600);

  await moveAndClick(page, page.getByRole("link", { name: "Message seller" }));
  await page.waitForLoadState("networkidle");
  await installDemoLayer(page);
  await chapter(
    page,
    "Guarded conversations",
    "Unsafe links, payment requests, and contact sharing are blocked.",
    "PyanThit keeps negotiations on platform. When a user requests outside payment, deterministic safety rules block the message and explain the risk immediately.",
  );
  const message = page.getByPlaceholder("Message safely…");
  await message.fill("send it to my KPay number");
  await moveAndClick(page, page.getByRole("button", { name: "Send message" }));
  await show(page, page.getByText(/Possible off-platform contact/), 2200);

  await goto(page, "/orders");
  await chapter(
    page,
    "Inspect first. Confirm second.",
    "Escrow, shipment evidence, single-use pickup, and a dispute path.",
    "Funds remain in escrow while the buyer inspects the item. Shipment evidence is recorded, pickup uses an expiring single-use QR code, and reporting a problem keeps funds held for review.",
  );
  await moveAndClick(page, page.getByRole("button", { name: "Show single-use pickup QR" }));
  await show(page, page.getByText(/Expires in/), 1900);
  await moveAndClick(page, page.getByRole("button", { name: "Report a problem" }));
  await show(page, page.getByText(/Funds remain held/), 1500);
  await moveAndClick(page, page.getByRole("button", { name: "I approve this item" }));
  await show(page, page.getByText("Buyer confirmed"), 1800);

  await goto(page, "/wallet");
  await chapter(
    page,
    "An auditable wallet",
    "Escrow is separated, every movement is balanced, corrections preserve history.",
    "The wallet separates available balance from escrow. Its append-only ledger makes every hold, release, refund, and assisted top-up visible and auditable.",
  );
  await moveAndClick(page, page.getByRole("button", { name: "Request top-up" }));
  await show(page, page.getByText("Top-up request created"), 1900);

  await goto(page, "/offers");
  await chapter(
    page,
    "Fair multi-buyer offers",
    "Negotiate without permanently losing waiting buyers.",
    "Sellers can negotiate with several verified buyers. Selecting one starts a twenty-four-hour window, while other offers wait and automatically reopen if the deal expires or is cancelled.",
  );
  const nway = page.locator("article").filter({ hasText: "Nway Oo" });
  await moveAndClick(page, nway.getByRole("button", { name: "Choose buyer" }));
  await show(page, page.getByText(/Everyone else moved to Waiting/), 1400);
  await moveAndClick(page, page.getByRole("button", { name: "Simulate 24h expiry" }));
  await show(page, page.getByText(/Waiting buyers are available again/), 1600);
  const min = page.locator("article").filter({ hasText: "Min Zaw" });
  await moveAndClick(page, min.getByRole("button", { name: "Choose buyer" }));
  await moveAndClick(page, page.getByRole("button", { name: "Confirm as selected buyer" }));
  await show(page, page.getByText(/ready for escrow funding/), 1700);

  await goto(page, "/sell");
  await chapter(
    page,
    "Evidence protects sellers too",
    "Dynamic watermarking, condition signals, IMEI, and delivery policy.",
    "The seller flow captures item details, private IMEI evidence, clear condition photos, and delivery policy. Public derivatives receive the seller name and upload date automatically.",
  );
  await moveAndClick(page, page.getByRole("button", { name: "2. Evidence" }));
  await page.locator('input[type="file"]').setInputFiles(path.join(root, "public", "pyanthit-icon.png"));
  await page.getByText("Protected preview ready").waitFor();
  await show(page, page.getByAltText("Dynamically watermarked listing preview"), 2200);
  await moveAndClick(page, page.getByRole("button", { name: "Continue" }));
  await sleep(1600);

  await goto(page, "/trust");
  await chapter(
    page,
    "Identity with human accountability",
    "Phone-bound access, masked NRC data, advisory AI, mandatory review.",
    "Trust combines phone verification and private NRC evidence. Automated checks remain advisory; a human reviewer is accountable for approval, and sensitive values stay masked.",
  );
  await moveAndClick(page, page.getByRole("button", { name: "Preview renewal flow" }));
  await show(page, page.getByText("Selfie check"), 1500);
  await moveAndClick(page, page.getByRole("button", { name: "Submit for assisted review" }));
  await show(page, page.getByText("Human review complete"), 1700);

  await goto(page, "/admin");
  await chapter(
    page,
    "Operations without hidden decisions",
    "Identity, funding, disputes, and logistics share immutable evidence history.",
    "Operators manage identity, wallet, dispute, and logistics queues. Every case exposes an immutable timeline from submission through automated signals to the required human decision.",
  );
  await moveAndClick(page, page.getByRole("button", { name: "Disputes" }));
  await sleep(1200);
  await moveAndClick(page, page.getByRole("button", { name: "Open" }).first());
  await show(page, page.getByText("Immutable audit timeline"), 2300);

  await goto(page, "/rewards");
  await chapter(
    page,
    "Reuse creates local value",
    "Verified trades earn non-cashable Eco-Points with local partners.",
    "Successful reuse earns non-cashable Eco-Points. Buyers can reserve practical local rewards while PyanThit tracks items kept in use and estimated emissions avoided.",
  );
  await moveAndClick(page, page.getByRole("button", { name: "650 points" }));
  await show(page, page.getByText(/reserved. Partner confirmation/), 1900);

  await goto(page, "/login");
  await chapter(
    page,
    "Secure access without using NRC as a password",
    "A one-time mobile code protects every session.",
    "Access is phone-bound. A one-time code signs the user in, while NRC evidence remains private and is never treated as a password.",
  );
  await moveAndClick(page, page.getByRole("button", { name: /Send secure code/ }));
  await moveAndClick(page, page.getByRole("button", { name: "Verify and sign in" }));
  await show(page, page.getByText("Identity + phone verified"), 1800);

  await goto(page, "/");
  await chapter(
    page,
    "Trust is the new currency.",
    "Verified people. Protected payment. Evidence before payout.",
    "PyanThit turns second-hand trade into a clear, protected journey. Second-hand, first-choice.",
  );
  await sleep(2200);
} finally {
  timeline.push({ end: elapsed() });
  await context.close();
  await browser.close();
}

const recordingPath = await video.path();
await writeFile(path.join(outputDir, "timeline.json"), JSON.stringify(timeline, null, 2));
await writeFile(path.join(outputDir, "recording-path.txt"), `${recordingPath}\n`);
console.log(recordingPath);
