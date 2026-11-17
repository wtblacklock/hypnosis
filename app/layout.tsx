import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reverie — guided self-hypnosis",
  description: "Guided hypnosis, visualization and relaxation with immersive, calming visuals.",
};
export const viewport: Viewport = { themeColor: "#03040d", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
