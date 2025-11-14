'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/lib/store/store';
import { getStoreBySlug } from '@/actions/store/get-store';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Star, Phone, Mail, Clock, MapPin } from 'lucide-react';

export default function StorePage() {
  const params = useParams();
  const store = params.store as string;
  const setTenant = useStore((state) => state.setTenant);

  const [tenant, setLocalTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const data = await getStoreBySlug(store);
        if (data) {
          setLocalTenant(data);
          // Store in Zustand (which also stores in localStorage)
          setTenant({
            id: data.id,
            name: data.name,
            slug: data.slug,
            email: data.email,
            phone: data.phone,
            websiteData: data.websiteData,
          });
        }
      } catch (error) {
        console.error('Failed to fetch store:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [store, setTenant]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Store Not Found</h1>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const websiteData = (tenant.websiteData as any) || {};
  const hero = websiteData.hero || {};

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden">
        {hero.image && (
          <Image
            src={hero.image}
            alt={tenant.name}
            fill
            className="object-cover opacity-30"
            priority
          />
        )}

        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-5xl font-bold text-white mb-4 max-w-3xl">
            {hero.title || tenant.name}
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mb-8">
            {hero.subtitle || 'Premium pet care services'}
          </p>
          <Link href={`/${store}/booking`}>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Book Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* About Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-4">About Us</h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
            {websiteData.about ||
              "We provide premium pet care services with experienced professionals dedicated to your pet's health and happiness."}
          </p>
        </section>

        {/* Contact Info */}
        <section className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold mb-6">Contact Information</h3>

            {tenant.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <a
                  href={`tel:${tenant.phone}`}
                  className="text-gray-600 hover:text-blue-600"
                >
                  {tenant.phone}
                </a>
              </div>
            )}

            {tenant.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <a
                  href={`mailto:${tenant.email}`}
                  className="text-gray-600 hover:text-blue-600"
                >
                  {tenant.email}
                </a>
              </div>
            )}

            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Open 9 AM - 6 PM, Monday to Sunday</span>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Your Location</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-6">Why Choose Us?</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                Professional & Experienced Team
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                Premium Quality Services
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                Customer Satisfaction Guaranteed
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                Easy Online Booking
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                Affordable Pricing
              </li>
            </ul>
          </div>
        </section>

        {/* Services Section */}
        {tenant.services && tenant.services.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold mb-8">Our Services</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {tenant.services.map((service: any) => (
                <Link
                  key={service.id}
                  href={`/${store}/booking?service=${service.id}`}
                >
                  <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                    <h3 className="text-xl font-bold mb-2 text-gray-900">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="text-2xl font-bold text-blue-600">
                        ₹{service.price}
                      </span>
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {service.duration} min
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Book?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Schedule your appointment now and experience our premium services
          </p>
          <Link href={`/${store}/booking`}>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Book Your Appointment
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-4">About</h3>
              <p className="text-sm">{tenant.name}</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Contact</h3>
              <p className="text-sm">{tenant.phone}</p>
              <p className="text-sm">{tenant.email}</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Hours</h3>
              <p className="text-sm">9 AM - 6 PM</p>
              <p className="text-sm">Mon - Sun</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Follow</h3>
              <p className="text-sm">Coming soon on social media</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p>&copy; 2025 {tenant.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
