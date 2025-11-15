'use client';

import { Button } from '@/components/ui/button';

export default function MarketingPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Marketing</h1>
        <p className="text-gray-600 mt-2">Grow your business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-4">📧</div>
          <h3 className="text-lg font-semibold mb-2">Email Campaigns</h3>
          <p className="text-gray-600 mb-4">Send promotional emails to customers</p>
          <Button className="bg-blue-600 hover:bg-blue-700">Create Campaign</Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-4">💳</div>
          <h3 className="text-lg font-semibold mb-2">Discount Codes</h3>
          <p className="text-gray-600 mb-4">Create special offers</p>
          <Button className="bg-blue-600 hover:bg-blue-700">Create Discount</Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-4">📱</div>
          <h3 className="text-lg font-semibold mb-2">Social Media</h3>
          <p className="text-gray-600 mb-4">Share your store on social platforms</p>
          <Button className="bg-blue-600 hover:bg-blue-700">Share Now</Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">Analytics</h3>
          <p className="text-gray-600 mb-4">View performance insights</p>
          <Button className="bg-blue-600 hover:bg-blue-700">View Analytics</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Marketing Tips</h2>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="text-2xl">✨</span>
            <span className="text-gray-700">Set up email campaigns to reach existing customers</span>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl">🎯</span>
            <span className="text-gray-700">Create seasonal discounts to boost bookings</span>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl">📸</span>
            <span className="text-gray-700">Share your services on Instagram and Facebook</span>
          </li>
          <li className="flex gap-3">
            <span className="text-2xl">⭐</span>
            <span className="text-gray-700">Encourage customers to leave reviews</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
