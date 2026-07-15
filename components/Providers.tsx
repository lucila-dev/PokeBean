"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PwaRegister } from "@/components/PwaRegister";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ThemeProvider>
        {children}
        <PwaRegister />
      </ThemeProvider>
    </SessionProvider>
  );
}
