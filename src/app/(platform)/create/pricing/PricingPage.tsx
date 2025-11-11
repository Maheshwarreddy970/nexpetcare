"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const PLANS = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 49,
    currency: '$',
    billing: 'per month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
    features: [
      'Unlimited appointments',
      'Customer management',
      'Service management',
      'Email notifications',
      'Analytics dashboard',
      'Team members (up to 5)',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    price: 499,
    currency: '$',
    billing: 'per year',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY,
    features: [
      'Everything in Monthly',
      'Save 15% compared to monthly',
      'Priority support',
      'Custom branding',
      'Advanced analytics',
      'Unlimited team members',
    ],
    popular: true,
  },
];

export default function PricingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const email = searchParams.get('email');
  const formDataStr = searchParams.get('formData');

  if (!email || !formDataStr) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-red-600">Missing email or form data</p>
      </div>
    );
  }

  let formData;
  try {
    formData = JSON.parse(decodeURIComponent(formDataStr));
  } catch {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-red-600">Invalid form data</p>
      </div>
    );
  }

  const handleSelectPlan = async (planId: string) => {
    setLoading(true);
    setError('');

    try {
      const plan = PLANS.find((p) => p.id === planId);

      if (!plan || !plan.priceId) {
        setError('Price configuration missing');
        return;
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          priceId: plan.priceId,
          metadata: formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Checkout failed');
      }

      const { url } = await response.json();
      if (url) window.location.href = url;
      else setError('Failed to create checkout session');

    } catch (err: any) {
      console.error('Error selecting plan:', err);
      setError(err.message || 'Failed to proceed');
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">
            Select the perfect plan for your pet care business
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl shadow-lg overflow-hidden transition-all ${
                selectedPlan === plan.id ? 'ring-2 ring-blue-600 scale-105' : ''
              } ${plan.popular ? 'md:scale-105' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                {/* Plan Name */}
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-5xl font-bold">
                    {plan.currency}
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">{plan.billing}</span>
                </div>

                {/* Monthly Equivalent */}
                {plan.id === 'yearly' && (
                  <p className="text-sm text-green-600 font-medium mb-6">
                    ✨ Save 15% compared to monthly ($588/year vs $49/month)
                  </p>
                )}

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading}
                  className={`w-full mb-8 py-6 text-lg font-semibold ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-800 hover:bg-gray-900'
                  }`}
                >
                  {loading ? 'Processing...' : 'Choose Plan'}
                </Button>

                {/* Features List */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Includes:
                  </p>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg">
              <h4 className="font-semibold mb-2">Can I change my plan later?</h4>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan anytime from your dashboard.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <h4 className="font-semibold mb-2">Is there a free trial?</h4>
              <p className="text-gray-600">
                Your first 14 days are free. No credit card required to start.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
              <p className="text-gray-600">
                Yes, cancel anytime. Your access will continue until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
