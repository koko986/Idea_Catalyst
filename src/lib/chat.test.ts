import { describe, expect, it } from "vitest";
import {
  buyerThreadId,
  draftThread,
  formatChatTime,
  lastPreview,
  listingThreadId,
  parseConversations,
  readConversations,
  sendMessage,
  sortConversations,
  upsertConversation,
} from "./chat";

const now = "2026-08-29T07:30:00.000Z";

describe("protected chat history", () => {
  it("starts with an empty inbox", () => {
    expect(readConversations(null)).toEqual([]);
    expect(parseConversations("")).toEqual([]);
    expect(parseConversations("not-json")).toEqual([]);
  });

  it("builds a seller thread from a listing and a buyer thread from an offer", () => {
    const seller = draftThread(listingThreadId("iphone-13"), now);
    expect(seller).toMatchObject({
      id: "listing-iphone-13",
      peerName: "May Thiri",
      peerInitials: "MT",
      listingTitle: "iPhone 13 · 128 GB",
      messages: [],
    });
    const buyer = draftThread(buyerThreadId("OF-103"), now);
    expect(buyer).toMatchObject({ id: "buyer-OF-103", peerName: "Nway Oo", peerInitials: "NO" });
    expect(draftThread("listing-missing")).toBeNull();
  });

  it("does not keep a thread in history until someone sends a message", () => {
    const draft = draftThread(listingThreadId("iphone-13"), now)!;
    expect(lastPreview(draft)).toBe("No messages yet");
    expect(sendMessage([], draft, "   ").items).toEqual([]);
  });

  it("stores a sent message so the conversation can be opened again", () => {
    const draft = draftThread(listingThreadId("iphone-13"), now)!;
    const first = sendMessage([], draft, "Is the battery health still 91%?", now);
    expect(first.items).toHaveLength(1);
    expect(first.conversation.messages[0]).toMatchObject({ text: "Is the battery health still 91%?", mine: true });
    expect(lastPreview(first.conversation)).toBe("Is the battery health still 91%?");

    const later = sendMessage(first.items, first.conversation, "I can collect today.", "2026-08-29T08:00:00.000Z");
    expect(later.items[0].messages).toHaveLength(2);
    expect(later.items[0].updatedAt).toBe("2026-08-29T08:00:00.000Z");
  });

  it("keeps blocked messages as history and surfaces the safety warning", () => {
    const draft = draftThread(listingThreadId("iphone-13"), now)!;
    const blocked = sendMessage([], draft, "send it to my KPay number", now);
    expect(blocked.warning).toMatch(/off-platform/i);
    expect(blocked.items).toHaveLength(1);
    expect(lastPreview(blocked.conversation)).toBe("Message blocked");
  });

  it("sorts conversations by the most recent message", () => {
    const older = { ...draftThread(listingThreadId("iphone-13"), now)!, updatedAt: "2026-08-28T10:00:00.000Z" };
    const newer = { ...draftThread(buyerThreadId("OF-104"), "2026-08-29T09:00:00.000Z")!, updatedAt: "2026-08-29T09:00:00.000Z" };
    expect(sortConversations([older, newer]).map((item) => item.id)).toEqual(["buyer-OF-104", "listing-iphone-13"]);
    expect(upsertConversation([older], newer)[0].id).toBe("buyer-OF-104");
  });

  it("formats recent chat timestamps", () => {
    const stamp = new Date("2026-08-29T07:00:00.000Z").getTime();
    expect(formatChatTime("2026-08-29T06:59:30.000Z", stamp)).toBe("Just now");
    expect(formatChatTime("2026-08-29T06:40:00.000Z", stamp)).toBe("20m");
    expect(formatChatTime("2026-08-29T04:00:00.000Z", stamp)).toBe("3h");
  });
});
