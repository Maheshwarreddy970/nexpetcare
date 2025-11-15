'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { verifyAdminSessionAction } from '@/actions/admin/login';

interface AdminSession {
  adminId: string;
  adminEmail: string;
  adminName: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const store = params.store as string;

  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Skip auth for login page
    if (pathname.includes('/login')) {
      setLoading(false);
      return;
    }

    // Check session
    const sessionStr = localStorage.getItem('adminSession');
    if (!sessionStr) {
      router.push(`/${store}/admin/login`);
      return;
    }

    try {
      const sessionData = JSON.parse(sessionStr);

      if (sessionData.tenantSlug !== store) {
        localStorage.removeItem('adminSession');
        router.push(`/${store}/admin/login`);
        return;
      }

      // Verify session is still valid
      verifyAdminSessionAction(sessionData.tenantId, sessionData.adminId).then(
        (result) => {
          if (result.success) {
            setSession(sessionData);
            setLoading(false);
          } else {
            localStorage.removeItem('adminSession');
            router.push(`/${store}/admin/login`);
          }
        }
      );
    } catch (error) {
      localStorage.removeItem('adminSession');
      router.push(`/${store}/admin/login`);
    }
  }, [store, router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    router.push(`/${store}/admin/login`);
  };

  // Show loading for protected routes
  if (loading && !pathname.includes('/login')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login without navigation
  if (pathname.includes('/login')) {
    return <>{children}</>;
  }

  if (!session) {
    return null;
  }

  // Navigation items
  const navItems = [
    { name: 'Dashboard', href: `/${store}/admin`, icon: '📊' },
    { name: 'Services', href: `/${store}/admin/services`, icon: '🛠️' },
    { name: 'Bookings', href: `/${store}/admin/bookings`, icon: '📅' },
    { name: 'Customers', href: `/${store}/admin/customers`, icon: '👥' },
      { name: 'Website', href: `/${store}/admin/website`, icon: '🌐' }, // ✅ NEW

    { name: 'Marketing', href: `/${store}/admin/marketing`, icon: '📢' },
    ...(session.role === 'root'
      ? [
          { name: 'Team', href: `/${store}/admin/team`, icon: '👨‍💼' },
          { name: 'Settings', href: `/${store}/admin/settings`, icon: '⚙️' },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {session.tenantName}
                </h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {session.adminName}
                </p>
                <p className="text-xs text-gray-500 uppercase">{session.role}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          >
            <aside
              className="w-64 bg-white h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
