'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTenantSettingsAction, updateTenantSettingsAction, getSubscriptionInfoAction } from '@/actions/admin/settings';

interface Subscription {
  subscriptionStatus: string;
  subscriptionPlan: string;
  stripeCurrentPeriodEnd: string | null;
  stripeCurrentPeriodStart: string | null;
  lastPaymentDate: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [subscription, setSubscription] = useState<Subscription>({
    subscriptionStatus: '',
    subscriptionPlan: '',
    stripeCurrentPeriodEnd: null,
    stripeCurrentPeriodStart: null,
    lastPaymentDate: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const sessionStr = localStorage.getItem('adminSession');
    if (!sessionStr) return;

    const session = JSON.parse(sessionStr);

    const settingsResult = await getTenantSettingsAction(session.tenantId);
    if (settingsResult.success && settingsResult.tenant) {
      setSettings({
        name: settingsResult.tenant.name,
        email: settingsResult.tenant.email || '',
        phone: settingsResult.tenant.phone || '',
      });
    }

    const subResult = await getSubscriptionInfoAction(session.tenantId);
    if (subResult.success && subResult.subscription) {
      setSubscription(subResult.subscription);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const sessionStr = localStorage.getItem('adminSession');
    if (!sessionStr) return;

    const session = JSON.parse(sessionStr);

    const result = await updateTenantSettingsAction(session.tenantId, settings);

    if (result.success) {
      alert('Settings saved successfully!');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your store settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-6">Store Information</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Name
              </label>
              <Input
                value={settings.name}
                onChange={(e) =>
                  setSettings({ ...settings, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <Input
                value={settings.phone}
                onChange={(e) =>
                  setSettings({ ...settings, phone: e.target.value })
                }
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Subscription</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold capitalize text-gray-900">
                {subscription.subscriptionStatus}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="text-lg font-semibold capitalize text-gray-900">
                {subscription.subscriptionPlan || 'N/A'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Valid Until</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscription.stripeCurrentPeriodEnd
                  ? new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>

            <Button variant="outline" className="w-full">
              Manage Subscription
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
