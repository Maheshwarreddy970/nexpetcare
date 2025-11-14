'use client';

import { createContext, useContext, ReactNode } from 'react';

interface StoreContextType {
  slug: string;
  storeName: string;
  tenantId: string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({
  children,
  slug,
  storeName,
  tenantId,
}: {
  children: ReactNode;
  slug: string;
  storeName: string;
  tenantId: string;
}) {
  return (
    <StoreContext.Provider value={{ slug, storeName, tenantId }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context;
}
