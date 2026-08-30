import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trader Analytics",
  description: "A focused trading journal and performance analytics dashboard.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
