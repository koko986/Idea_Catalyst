import { listings } from "@/lib/data";
import { inspectChat } from "@/lib/domain";

export const CHAT_STORAGE_KEY = "pyanthit.chat.v1";
export const CHAT_CHANGED_EVENT = "pyanthit-chat-changed";

export type ChatMessage = {
  id: string;
  text: string;
  mine: boolean;
  blocked?: boolean;
  createdAt: string;
};

export type Conversation = {
  id: string;
  peerName: string;
  peerInitials: string;
  listingId: string | null;
  listingTitle: string;
  verified: boolean;
  messages: ChatMessage[];
  updatedAt: string;
};

export type BuyerPeer = {
  offerId: string;
  buyerName: string;
  listingId: string;
  listingTitle: string;
};

export const buyerPeers: BuyerPeer[] = [
  { offerId: "OF-104", buyerName: "Kyaw Thu", listingId: "iphone-13", listingTitle: "iPhone 13 · 128 GB" },
  { offerId: "OF-103", buyerName: "Nway Oo", listingId: "iphone-13", listingTitle: "iPhone 13 · 128 GB" },
  { offerId: "OF-101", buyerName: "Min Zaw", listingId: "iphone-13", listingTitle: "iPhone 13 · 128 GB" },
];

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]!.toUpperCase()).join("") || "?";
}

export function listingThreadId(listingId: string) {
  return `listing-${listingId}`;
}

export function buyerThreadId(offerId: string) {
  return `buyer-${offerId}`;
}

export function parseListingThreadId(id: string) {
  return id.startsWith("listing-") ? id.slice("listing-".length) : null;
}

export function parseBuyerThreadId(id: string) {
  return id.startsWith("buyer-") ? id.slice("buyer-".length) : null;
}

export function sortConversations(items: Conversation[]) {
  return [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function lastPreview(conversation: Conversation) {
  const last = conversation.messages.at(-1);
  if (!last) return "No messages yet";
  if (last.blocked) return "Message blocked";
  return last.text;
}

export function formatChatTime(iso: string, now = Date.now()) {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const delta = Math.max(0, now - then);
  if (delta < 60_000) return "Just now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(then);
}

export function draftListingThread(listingId: string, now = new Date().toISOString()): Conversation | null {
  const listing = listings.find((item) => item.id === listingId);
  if (!listing) return null;
  return {
    id: listingThreadId(listingId),
    peerName: listing.seller,
    peerInitials: initials(listing.seller),
    listingId,
    listingTitle: listing.title,
    verified: listing.verified,
    messages: [],
    updatedAt: now,
  };
}

export function draftBuyerThread(peer: BuyerPeer, now = new Date().toISOString()): Conversation {
  return {
    id: buyerThreadId(peer.offerId),
    peerName: peer.buyerName,
    peerInitials: initials(peer.buyerName),
    listingId: peer.listingId,
    listingTitle: peer.listingTitle,
    verified: true,
    messages: [],
    updatedAt: now,
  };
}

export function draftThread(id: string, now = new Date().toISOString()): Conversation | null {
  const listingId = parseListingThreadId(id);
  if (listingId) return draftListingThread(listingId, now);
  const offerId = parseBuyerThreadId(id);
  if (!offerId) return null;
  const peer = buyerPeers.find((item) => item.offerId === offerId);
  return peer ? draftBuyerThread(peer, now) : null;
}

export function upsertConversation(items: Conversation[], conversation: Conversation) {
  return sortConversations([conversation, ...items.filter((item) => item.id !== conversation.id)]);
}

export function sendMessage(
  items: Conversation[],
  conversation: Conversation,
  text: string,
  now = new Date().toISOString(),
) {
  const trimmed = text.trim();
  if (!trimmed) return { items, conversation, warning: "" };
  const result = inspectChat(trimmed);
  const message: ChatMessage = result.allowed
    ? { id: `${now}-out`, text: trimmed, mine: true, createdAt: now }
    : { id: `${now}-block`, text: "Blocked message · kept as a security event", mine: true, blocked: true, createdAt: now };
  const nextConversation: Conversation = {
    ...conversation,
    messages: [...conversation.messages, message],
    updatedAt: now,
  };
  return {
    items: upsertConversation(items, nextConversation),
    conversation: nextConversation,
    warning: result.allowed ? "" : (result.reason ?? "Message blocked"),
  };
}

export function parseConversations(raw: string): Conversation[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return sortConversations(parsed.filter(isConversation));
  } catch {
    return [];
  }
}

export function readConversations(storage: Pick<Storage, "getItem"> | null): Conversation[] {
  if (!storage) return [];
  return parseConversations(storage.getItem(CHAT_STORAGE_KEY) ?? "[]");
}

export function writeConversations(storage: Pick<Storage, "setItem">, items: Conversation[]) {
  storage.setItem(CHAT_STORAGE_KEY, JSON.stringify(items));
}

export function persistConversations(items: Conversation[]) {
  if (typeof window === "undefined") return;
  writeConversations(window.localStorage, items);
  window.dispatchEvent(new Event(CHAT_CHANGED_EVENT));
}

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== "object") return false;
  const item = value as Conversation;
  return typeof item.id === "string"
    && typeof item.peerName === "string"
    && typeof item.peerInitials === "string"
    && typeof item.listingTitle === "string"
    && typeof item.updatedAt === "string"
    && Array.isArray(item.messages);
}
