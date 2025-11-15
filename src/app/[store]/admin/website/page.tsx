'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getTenantSettingsAction, updateWebsiteDataAction } from '@/actions/admin/settings';

export default function WebsiteEditorPage() {
  const [websiteData, setWebsiteData] = useState({
    hero: {
      title: '',
      subtitle: '',
      image: '',
    },
    about: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWebsiteData();
  }, []);

  const fetchWebsiteData = async () => {
    const sessionStr = localStorage.getItem('adminSession');
    if (!sessionStr) return;

    const session = JSON.parse(sessionStr);
    const result = await getTenantSettingsAction(session.tenantId);

    if (result.success && result.tenant) {
      const data = result.tenant.websiteData as any;
      if (data) {
        setWebsiteData({
          hero: data.hero || { title: '', subtitle: '', image: '' },
          about: data.about || '',
        });
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const sessionStr = localStorage.getItem('adminSession');
    if (!sessionStr) return;

    const session = JSON.parse(sessionStr);

    const result = await updateWebsiteDataAction(session.tenantId, websiteData);

    if (result.success) {
      alert('Website updated successfully!');
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
        <h1 className="text-3xl font-bold text-gray-900">Website Editor</h1>
        <p className="text-gray-600 mt-2">Customize your store website</p>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <div>
            <h2 className="text-xl font-bold mb-4">Hero Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Title
                </label>
                <Input
                  value={websiteData.hero.title}
                  onChange={(e) =>
                    setWebsiteData({
                      ...websiteData,
                      hero: { ...websiteData.hero, title: e.target.value },
                    })
                  }
                  placeholder="Welcome to Your Store"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero Subtitle
                </label>
                <Input
                  value={websiteData.hero.subtitle}
                  onChange={(e) =>
                    setWebsiteData({
                      ...websiteData,
                      hero: { ...websiteData.hero, subtitle: e.target.value },
                    })
                  }
                  placeholder="Premium pet care services"
                />
              </div>
            </div>
          </div>

          {/* About Section */}
          <div>
            <h2 className="text-xl font-bold mb-4">About Section</h2>
            <textarea
              value={websiteData.about}
              onChange={(e) =>
                setWebsiteData({ ...websiteData, about: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={6}
              placeholder="Tell customers about your business..."
            />
          </div>

          {/* Preview */}
          <div>
            <h2 className="text-xl font-bold mb-4">Preview</h2>
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg mb-4">
                <h3 className="text-2xl font-bold">{websiteData.hero.title}</h3>
                <p className="text-lg mt-2">{websiteData.hero.subtitle}</p>
              </div>
              <div className="bg-white p-6 rounded-lg">
                <h4 className="font-bold mb-2">About</h4>
                <p className="text-gray-700">{websiteData.about}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
