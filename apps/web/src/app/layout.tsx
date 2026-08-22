import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AssetForge",
  description: "AI asset generation MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
