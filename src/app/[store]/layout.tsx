'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTenantBySlugAction } from '@/actions/store/tenant';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  websiteData: any;
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const store = params.store as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenant();
  }, [store]);

  const fetchTenant = async () => {
    const result = await getTenantBySlugAction(store);
    if (result.success && result.tenant) {
      setTenant(result.tenant as Tenant);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Store Not Found</h1>
          <p className="text-gray-600">This store doesn't exist or is inactive.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/${store}`}>
              <h1 className="text-2xl font-bold text-blue-600">{tenant.name}</h1>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href={`/${store}`} className="text-gray-700 hover:text-blue-600">
                Home
              </Link>
              <Link href={`/${store}/services`} className="text-gray-700 hover:text-blue-600">
                Services
              </Link>
              <Link href={`/${store}/customer/bookings`} className="text-gray-700 hover:text-blue-600">
                Book Now
              </Link>
              <Link href={`/${store}/contact`} className="text-gray-700 hover:text-blue-600">
                Contact
              </Link>
            </nav>

            <Link
              href={`/${store}/services`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{tenant.name}</h3>
              <p className="text-gray-400">Your trusted pet care service provider</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <p className="text-gray-400">{tenant.email}</p>
              <p className="text-gray-400">{tenant.phone}</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link href={`/${store}/services`} className="block text-gray-400 hover:text-white">
                  Services
                </Link>
                <Link href={`/${store}/booking`} className="block text-gray-400 hover:text-white">
                  Book Now
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 {tenant.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
