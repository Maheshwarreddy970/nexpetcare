'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function PricingPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const formDataStr = searchParams.get('formData');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Parse form data from URL
  const formData = formDataStr ? JSON.parse(decodeURIComponent(formDataStr)) : null;

  if (!email || !formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Missing email or form data</p>
        </div>
      </div>
    );
  }

  const handleCheckout = async (priceId: string) => {
    setLoading(true);
    setError('');

    try {
      // Save form data to sessionStorage for success page
      sessionStorage.setItem('checkoutFormData', JSON.stringify(formData));

      console.log('Creating checkout session with:', {
        email,
        priceId,
        formData,
      });

      // Call checkout API with formData
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          priceId,
          formData, // ✅ Pass formData here
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
          <p className="text-blue-100 text-lg">Select the best plan for your clinic</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-8 max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Monthly Plan */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8 text-white">
              <h2 className="text-2xl font-bold mb-2">Monthly</h2>
              <p className="text-blue-100 mb-6">Perfect for getting started</p>
              <div className="text-4xl font-bold">₹299</div>
              <p className="text-blue-100 text-sm">per month</p>
            </div>

            <div className="p-6 space-y-4">
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">Full Admin Dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">Public Website</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">Booking System</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">Email Support</span>
                </li>
              </ul>

              <Button
                onClick={() => handleCheckout('price_1SQ5ecSC5hEH1yExs8ayMHys')}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
              >
                {loading ? 'Processing...' : 'Get Started'}
              </Button>
            </div>
          </div>

          {/* Yearly Plan */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition border-2 border-purple-600 relative">
            <div className="absolute top-0 right-0 bg-purple-600 text-white px-4 py-1 text-sm font-bold">
              SAVE 20%
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-8 text-white">
              <h2 className="text-2xl font-bold mb-2">Yearly</h2>
              <p className="text-purple-100 mb-6">Best value for growing clinics</p>
              <div className="text-4xl font-bold">₹2,990</div>
              <p className="text-purple-100 text-sm">per year (₹249/month)</p>
            </div>

            <div className="p-6 space-y-4">
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">Everything in Monthly</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">Priority Support</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">Advanced Analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">20% Discount</span>
                </li>
              </ul>

              <Button
                onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || 'price_yearly')}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3"
              >
                {loading ? 'Processing...' : 'Get Started'}
              </Button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-12 text-center text-blue-100">
          <p>All plans include a 7-day free trial. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
}
