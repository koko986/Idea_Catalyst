import { redirect } from "next/navigation";

export default function ChatPage() {
  redirect("/marketplace?tab=seller");
}
