export function getBaseUrl(req?: Request): string {
  // For server-side
  if (typeof window === 'undefined') {
    // Check environment variable first
    if (process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
      return process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    }
    
    // Fallback for Vercel deployments
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // Local development fallback
    return 'http://localhost:3000';
  }
  
  // For client-side
  return window.location.origin;
}
