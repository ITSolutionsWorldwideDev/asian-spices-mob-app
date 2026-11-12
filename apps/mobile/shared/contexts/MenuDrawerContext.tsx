import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type MenuDrawerContextValue = {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

const MenuDrawerContext = createContext<MenuDrawerContextValue | null>(null);

export function MenuDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);
  const toggleDrawer = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({ isOpen, openDrawer, closeDrawer, toggleDrawer }),
    [isOpen, openDrawer, closeDrawer, toggleDrawer]
  );

  return (
    <MenuDrawerContext.Provider value={value}>{children}</MenuDrawerContext.Provider>
  );
}

export function useMenuDrawer() {
  const context = useContext(MenuDrawerContext);
  if (!context) {
    throw new Error("useMenuDrawer must be used within MenuDrawerProvider");
  }
  return context;
}
