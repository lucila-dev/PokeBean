import type { Metadata, Viewport } from "next";
import { Nunito, Quicksand, Fredoka } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Providers } from "@/components/Providers";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
  weight: ["500", "600", "700"],
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fef3c7" },
    { media: "(prefers-color-scheme: dark)", color: "#1e3a5f" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "PokeBean",
  description: "Scan, catalog, and analyze your Pokemon TCG collection",
  applicationName: "PokeBean",
  metadataBase: new URL("https://pokebean.uk"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PokeBean",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${quicksand.variable} ${fredoka.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('pokebean-theme');if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans bg-stone-50 dark:bg-slate-950 text-stone-900 dark:text-stone-100">
        <Providers>
          <Nav />
          <main className="flex-1 w-full container mx-auto px-4 py-8 relative">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
