"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { WorkspaceConfigProvider } from "@/contexts/workspace-config";

export function Providers({
  children,
  defaultWorkspace,
}: {
  children: React.ReactNode;
  defaultWorkspace: string;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <WorkspaceConfigProvider defaultWorkspace={defaultWorkspace}>
        {children}
      </WorkspaceConfigProvider>
    </NextThemesProvider>
  );
}
