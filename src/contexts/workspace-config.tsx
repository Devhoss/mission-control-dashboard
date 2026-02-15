"use client";

import { createContext, useContext } from "react";

const WorkspaceConfigContext = createContext<string>("workspace-main");

export function WorkspaceConfigProvider({
  defaultWorkspace,
  children,
}: {
  defaultWorkspace: string;
  children: React.ReactNode;
}) {
  return (
    <WorkspaceConfigContext.Provider value={defaultWorkspace}>
      {children}
    </WorkspaceConfigContext.Provider>
  );
}

export function useDefaultWorkspace(): string {
  return useContext(WorkspaceConfigContext);
}
