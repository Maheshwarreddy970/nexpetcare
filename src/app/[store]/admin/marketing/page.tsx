'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Share2, BarChart3 } from 'lucide-react';

export default function MarketingPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const storeUrl = window.location.origin + window.location.pathname.replace('/admin/marketing', '');
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing</h1>
        <p className="text-gray-600 mt-2">Grow your business</p>
      </div>

      {/* Share Store Link */}
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold">Share Your Store</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Share your store link on social media to attract more customers
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={window.location.origin + window.location.pathname.replace('/admin/marketing', '')}
            readOnly
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
          <Button onClick={handleCopyLink}>
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </div>
      </div>

      {/* Email Campaigns */}
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold">Email Campaigns</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Send promotional emails to your customers
        </p>
        <Button>Create Campaign</Button>
      </div>

      {/* Analytics */}
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold">Analytics</h2>
        </div>
        <p className="text-gray-600 mb-4">
          View your store analytics and performance
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Store Views</p>
            <p className="text-2xl font-bold text-blue-600">0</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Bookings</p>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Conversion Rate</p>
            <p className="text-2xl font-bold text-purple-600">0%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
