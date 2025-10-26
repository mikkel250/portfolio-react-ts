import "../styles/globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar/Navbar";
import { Footer } from "@/components/Footer";
import { Contact } from "@/components/Contact";
import Script from "next/script";
import ChatWidget from "@/components/ChatWidget";
import { AppProvider } from "@/contexts/AppContext";

export const metadata: Metadata = {
  title: "Mikkel Ridley | Software Engineer",
  description: "A portfolio site showcasing my work and skills as a software engineer.",
  metadataBase: new URL("https://portfolio-react-ts-mocha.vercel.app/"),
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover", // Enables safe area insets
  },
  icons: {
    icon: [
    { url: "/images/my-profile.png", sizes: "32x32", type: "image/png" },
    { url: "/images/my-profile.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/images/my-profile.png",
    apple: "/images/my-profile.png",
    },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-zinc-900">
        <AppProvider>
          <Navbar />
          {children}
          <Footer />
          {/* <Contact /> */}
          <ChatWidget />
        </AppProvider>
      </body>
    </html>
  );
}
