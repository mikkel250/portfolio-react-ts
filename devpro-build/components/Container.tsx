"use client";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import React from "react";
import { Contact } from "./Contact";
import { Footer } from "./Footer";

import Navbar from "./Navbar/Navbar";

export const Container = (props: any) => {
  const { children, className } = props;

  return (
    <>
      <main className={clsx("min-h-screen antialiased bg-zinc-900", className)}>
        {children}
        <Footer />
      </main>
    </>
  );
};
