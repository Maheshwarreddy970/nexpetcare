"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    fetch(`/api/stripe/session?session_id=${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setTenantSlug(data.slug);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching session:', err);
        setError('Failed to load tenant information');
        setLoading(false);
      });
  }, [searchParams]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4">Loading your clinic setup...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p>{error}</p>
        </div>
        <Button onClick={() => window.location.href = '/'} className="mt-4">
          Go Back Home
        </Button>
      </div>
    );
  }

  if (!tenantSlug) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-lg">
          <p>Tenant information not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">🎉 Congratulations!</h1>
      <p className="text-xl mb-6 text-gray-600">
        Your clinic has been created successfully!
      </p>
      
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg border border-blue-200 mb-6">
        <p className="text-sm text-gray-600 mb-2">Your store URL:</p>
        <code className="text-2xl font-mono font-bold text-blue-600 break-all">
          http://localhost:3000/{tenantSlug}
        </code>
        <p className="text-sm text-gray-500 mt-4">
          (This will be nexpetcare.live/{tenantSlug} in production)
        </p>
      </div>

      <div className="space-y-3">
        <Button size="lg" onClick={() => router.push(`/${tenantSlug}/admin`)} className="w-full">
          Go to Admin Dashboard
        </Button>
        <Button size="lg" variant="outline" onClick={() => router.push(`/${tenantSlug}`)} className="w-full">
          View Public Store
        </Button>
      </div>

      <p className="text-sm text-gray-500 mt-6">
        Your subscription is now active. You'll receive a confirmation email shortly.
      </p>
    </div>
  );
}
