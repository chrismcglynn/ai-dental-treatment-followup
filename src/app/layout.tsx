import type { Metadata } from "next";
import { geistSans, geistMono, lora } from "@/lib/fonts";
import { Providers } from "@/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "FollowUp - AI Treatment Follow-up",
  description: "Intelligent patient follow-up and revenue recovery for dental practices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}