'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const store = params.store as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('customerSession');
    
    // Allow login and signup pages without session
    const pathname = window.location.pathname;
    if (pathname.includes('/login') || pathname.includes('/signup')) {
      setLoading(false);
      return;
    }

    // Check session for other pages
    if (!session) {
      router.push(`/${store}/customer/login`);
      return;
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return <>{children}</>;
}
