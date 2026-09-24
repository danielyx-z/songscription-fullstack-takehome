import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Play Anything | Practice Catalogue",
  description: "Piano transcription catalogue with audio preview and practice tracking.",
  icons: {
    icon: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
