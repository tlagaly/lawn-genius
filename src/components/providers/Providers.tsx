'use client';

import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "./TRPCProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </TRPCProvider>
    </SessionProvider>
  );
}