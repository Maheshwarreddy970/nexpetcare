'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendOtpAction } from '@/actions/platform/send-otp';
import { verifyOtpAction } from '@/actions/platform/verify-otp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CreateTenantPage() {
  const router = useRouter();

  
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    storeName: '',
    storePassword: '',
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ Pass form data to sendOtpAction
      await sendOtpAction(formData.email, {
        name: formData.name,
        storeName: formData.storeName,
        phone: formData.phone,
      });
      setStep('otp');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

 const handleOtpVerify = async () => {
  setLoading(true);
  setError('');

  try {
    const verified = await verifyOtpAction(formData.email, otp);

    if (verified) {
      // ✅ Redirect to pricing page instead of Stripe directly
      const formDataEncoded = encodeURIComponent(JSON.stringify(formData));
      router.push(
        `/create/pricing?email=${formData.email}&formData=${formDataEncoded}`
      );
    } else {
      setError('Invalid OTP. Please try again.');
    }
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    setError(error.message || 'Failed to verify OTP');
  } finally {
    setLoading(false);
  }
};


  if (step === 'otp') {
    return (
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
        <p className="mb-4 text-gray-600">
          Enter the 6-digit code sent to <strong>{formData.email}</strong>
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          placeholder="000000"
          className="text-center text-2xl tracking-widest mb-4"
        />

        <Button
          onClick={handleOtpVerify}
          disabled={loading || otp.length !== 6}
          className="w-full mb-2"
        >
          {loading ? 'Processing...' : 'Verify & Continue to Payment'}
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setStep('form');
            setOtp('');
          }}
          disabled={loading}
          className="w-full"
        >
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create Your Clinic</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Your Name *</label>
          <Input
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <Input
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone *</label>
          <Input
            type="tel"
            placeholder="+91 XXXXX XXXXX"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Personal Password *</label>
          <Input
            type="password"
            placeholder="Secure password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>

        <hr className="my-4" />

        <div>
          <label className="block text-sm font-medium mb-1">
            Store/Clinic Name *
          </label>
          <Input
            type="text"
            placeholder="Pawsome Grooming Clinic"
            value={formData.storeName}
            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be your store URL: http://localhost:3000/{formData.storeName.toLowerCase().replace(/\s+/g, '-')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Admin Password (for dashboard) *
          </label>
          <Input
            type="password"
            placeholder="Admin dashboard password"
            value={formData.storePassword}
            onChange={(e) => setFormData({ ...formData, storePassword: e.target.value })}
            required
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Sending OTP...' : 'Continue to OTP Verification'}
        </Button>
      </form>
    </div>
  );
}
