import type { Metadata } from "next";
import Script from "next/script";
import { geistSans, geistMono, lora } from "@/lib/fonts";
import { Providers } from "@/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retaine - AI Treatment Follow-up",
  description: "Intelligent patient follow-up and revenue recovery for dental practices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script
        defer
        src="https://analytics.retaine.io/script.js"
        data-website-id="189a27c3-9b39-4e6e-9620-a86d391d702d"
        strategy="afterInteractive"
      />
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}