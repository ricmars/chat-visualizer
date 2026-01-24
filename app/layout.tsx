import type { Metadata } from "next";
import "../src/app/globals.css";

export const metadata: Metadata = {
  title: "AI Chat Message Visualizer",
  description: "Marketing Campaign Simulation with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon-32x32.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
