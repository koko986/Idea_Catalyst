import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Myanmar } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const myanmar = Noto_Sans_Myanmar({ subsets: ["myanmar"], variable: "--font-myanmar" });

export const metadata: Metadata = {
  title: { default: "ReTrust — Buy second-hand with confidence", template: "%s · ReTrust" },
  description: "Myanmar's trust-first marketplace with verified people, protected chat, and escrow.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "ReTrust" },
};

export const viewport: Viewport = { themeColor: "#145c3f", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${mono.variable} ${myanmar.variable}`} data-scroll-behavior="smooth">
      <body>
        <PwaRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
