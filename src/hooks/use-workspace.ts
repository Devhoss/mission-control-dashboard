"use client";

import { useQueryState } from "./use-query-state";
import { useDefaultWorkspace } from "@/contexts/workspace-config";

export function useWorkspace() {
  const defaultWorkspace = useDefaultWorkspace();
  const [workspaceParam, setWorkspaceParam] = useQueryState("ws");

  const workspace = workspaceParam ?? defaultWorkspace;

  function setWorkspace(ws: string) {
    setWorkspaceParam(ws.trim() === "" ? null : ws);
  }

  return {
    workspace,
    setWorkspace,
    workspaceParam,
  };
}
