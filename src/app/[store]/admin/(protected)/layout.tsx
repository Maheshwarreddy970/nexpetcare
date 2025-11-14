'use client';

import { useStore } from '@/lib/store/store';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/sidebar';
import AdminHeader from '@/components/admin/header';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const params = useParams();
  const store = params.store as string;
  const adminSession = useStore((state) => state.adminSession);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!adminSession) {
      router.push(`/${store}/admin/login`);
    } else {
      setIsChecking(false);
    }
  }, [adminSession, store, router]);

  if (isChecking || !adminSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar store={store} adminRole={adminSession.role} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader tenantName={store} email={adminSession.adminEmail} />

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
