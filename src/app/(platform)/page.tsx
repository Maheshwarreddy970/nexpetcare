import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-6">
          Welcome to NexPetCare
        </h1>
        <p className="text-xl mb-8 text-gray-600">
          The all-in-one solution for pet grooming and veterinary clinics
        </p>
        <Link href="/create">
          <Button size="lg">Get Started</Button>
        </Link>
      </div>
    </div>
  );
}
