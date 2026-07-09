"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "flowcrm:active-organization-id";

interface ActiveOrganizationValue {
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string) => void;
}

const ActiveOrganizationContext = createContext<ActiveOrganizationValue | null>(null);

export function ActiveOrganizationProvider({ children }: { children: ReactNode }) {
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setActiveOrganizationIdState(stored);
  }, []);

  function setActiveOrganizationId(id: string) {
    window.localStorage.setItem(STORAGE_KEY, id);
    setActiveOrganizationIdState(id);
  }

  return (
    <ActiveOrganizationContext.Provider
      value={{ activeOrganizationId, setActiveOrganizationId }}
    >
      {children}
    </ActiveOrganizationContext.Provider>
  );
}

export function useActiveOrganization() {
  const ctx = useContext(ActiveOrganizationContext);
  if (!ctx) {
    throw new Error("useActiveOrganization must be used within ActiveOrganizationProvider");
  }
  return ctx;
}