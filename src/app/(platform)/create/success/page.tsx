'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState('verifying');
  const [storeData, setStoreData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const setupClinic = async () => {
      try {
        console.log('🧪 Setting up clinic...');

        // Get form data from sessionStorage
        const formDataStr = sessionStorage.getItem('checkoutFormData');
        if (!formDataStr) {
          throw new Error('No form data found');
        }

        const formData = JSON.parse(formDataStr);

        // Call test webhook to setup everything
        console.log('📝 Creating clinic with:', formData.email);
        const webhookResponse = await fetch('/api/test/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            storeName: formData.storeName,
            storePassword: formData.storePassword,
            name: formData.name,
            phone: formData.phone,
          }),
        });

        const webhookData = await webhookResponse.json();

        if (webhookData.success) {
          console.log('✅ Clinic setup completed');
          setStoreData(webhookData.tenant);
          setStatus('success');
          
          // Clear the stored data
          sessionStorage.removeItem('checkoutFormData');
        } else {
          throw new Error(webhookData.error || 'Setup failed');
        }
      } catch (error: any) {
        console.error('❌ Error:', error.message);
        setError(error.message);
        setStatus('error');
      }
    };

    setupClinic();
  }, []);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 px-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin mb-4">
            <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
          <p className="text-gray-600">Setting up your clinic...</p>
        </div>
      </div>
    );
  }

  if (status === 'success' && storeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Congratulations!</h1>
            <p className="text-gray-600 text-lg">Your clinic has been created successfully!</p>
          </div>

          {/* Store Info */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Store Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Store Name</p>
                <p className="text-lg font-semibold text-gray-900">{storeData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Store URL</p>
                <a
                  href={`http://localhost:3000/${storeData.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-blue-600 hover:underline"
                >
                  http://localhost:3000/{storeData.slug}
                </a>
                <p className="text-xs text-gray-500 mt-1">
                  (Will be nexpetcare.live/{storeData.slug} in production)
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subscription Status</p>
                <p className="text-lg font-semibold text-green-600 capitalize">
                  {storeData.subscriptionStatus} ✓
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valid Until</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(storeData.stripeCurrentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="bg-purple-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What's Included</h2>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✓</span>
                <span className="text-gray-700">Admin Dashboard</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✓</span>
                <span className="text-gray-700">Public Store Website</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✓</span>
                <span className="text-gray-700">2 Dummy Services (Grooming & Training)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✓</span>
                <span className="text-gray-700">Root Admin Account Created</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✓</span>
                <span className="text-gray-700">Payment Processing Active</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Link href={`/${storeData.slug}/admin/login`}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Go to Admin Dashboard
              </Button>
            </Link>
            <Link href={`/${storeData.slug}`}>
              <Button variant="outline" className="w-full">
                View Public Store
              </Button>
            </Link>
          </div>

          {/* Info Message */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">
              A confirmation email has been sent to <strong>{storeData.email}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              You can now login with your email and the password you provided during signup
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 px-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
        <p className="text-gray-600 mb-6">{error || 'Failed to setup your clinic'}</p>
        <Link href="/create">
          <Button variant="outline" className="w-full">
            Try Again
          </Button>
        </Link>
      </div>
    </div>
  );
}
