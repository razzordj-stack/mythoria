import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mythoria – AI Dungeon Master",
    template: "%s | Mythoria",
  },
  description: "Erschaffe Helden und erlebe dynamische Fantasy-Abenteuer.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${inter.variable} ${cinzel.variable}`}>
      <body>{children}</body>
    </html>
  );
}
