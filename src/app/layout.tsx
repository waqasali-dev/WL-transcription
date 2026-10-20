import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Splicer · Precision Audio Engine",
  description:
    "Frame-accurate speech transcription & word-level alignment: Gemini native audio, FFmpeg waveform onset detection, 4-pass gapless alignment.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
