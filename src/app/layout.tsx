// =============================================================================
// ConMart — Root Layout
// =============================================================================
// App-wide layout with Geist font family, dark theme by default,
// and SEO metadata for the B2B Construction Marketplace.
// =============================================================================

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n/language-context";

export const metadata: Metadata = {
  title: {
    default: "ConMart — B2B Construction Marketplace",
    template: "%s | ConMart",
  },
  description:
    "Industrial-grade B2B marketplace for construction materials. Volume pricing, proforma invoicing, and managed procurement for builders and contractors.",
  keywords: [
    "construction materials",
    "B2B marketplace",
    "building supplies",
    "cement",
    "steel",
    "rebar",
    "aggregates",
    "volume pricing",
    "proforma invoice",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      /** Dark theme by default — industrial B2B aesthetic */
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('conmart_theme');
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.remove('light');
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
