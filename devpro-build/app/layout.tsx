import "../styles/globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar/Navbar";
import { Footer } from "@/components/Footer";
import { Contact } from "@/components/Contact";
import Script from "next/script";
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "Devpro | Portfolio Template",
  description: "A portfolio template for developers and designers.",
  metadataBase: new URL("https://yourwebsite.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-zinc-900">
        <Navbar />
        {children}
        <Footer />
        {/* <Contact /> */}
        <ChatWidget />
      </body>
    </html>
  );
}
