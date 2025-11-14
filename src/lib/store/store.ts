import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantState {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string | null;
  websiteData?: any;
}

interface AdminSession {
  adminId: string;
  adminEmail: string;
  tenantId: string;
  tenantSlug: string;
  role: 'root' | 'admin' | 'staff';
}

interface StoreState {
  // Tenant state
  tenant: TenantState | null;
  setTenant: (tenant: TenantState | null) => void;
  
  // Admin session state
  adminSession: AdminSession | null;
  setAdminSession: (session: AdminSession | null) => void;
  
  // Actions
  logout: () => void;
  clearAll: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // Initial state
      tenant: null,
      adminSession: null,
      
      // Tenant actions
      setTenant: (tenant) => set({ tenant }),
      
      // Admin session actions
      setAdminSession: (session) => set({ adminSession: session }),
      
      // Logout (clear admin session only)
      logout: () => set({ adminSession: null }),
      
      // Clear all data
      clearAll: () => set({ tenant: null, adminSession: null }),
    }),
    {
      name: 'nexpetcare-storage', // localStorage key
      partialize: (state) => ({
        tenant: state.tenant,
        adminSession: state.adminSession,
      }),
    }
  )
);
