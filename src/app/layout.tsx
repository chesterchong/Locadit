import type { Metadata } from "next";
import { Aldrich, Caveat, Fredoka, Gochi_Hand, Inter, JetBrains_Mono, Playfair_Display, Press_Start_2P, Righteous } from "next/font/google";
import "./globals.css";

// Self-hosted and preloaded, so the intro's wordmark faces are on hand before their beat.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], weight: "700", variable: "--font-caveat", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: "700", variable: "--font-playfair", display: "swap" });
const fredoka = Fredoka({ subsets: ["latin"], weight: "700", variable: "--font-fredoka", display: "swap" });
const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-pixel", display: "swap" });
const righteous = Righteous({ subsets: ["latin"], weight: "400", variable: "--font-righteous", display: "swap" });
const marker = Gochi_Hand({ subsets: ["latin"], weight: "400", variable: "--font-marker", display: "swap" });
const caption = Aldrich({ subsets: ["latin"], weight: "400", variable: "--font-caption", display: "swap" });

export const metadata: Metadata = {
  title: "Locadit",
  description: "Group trip planning without the argument",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} ${caveat.variable} ${playfair.variable} ${fredoka.variable} ${pixel.variable} ${righteous.variable} ${marker.variable} ${caption.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
