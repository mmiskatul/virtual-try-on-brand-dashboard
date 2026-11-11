import Link from 'next/link';
import { Button } from '../components/ui/button';

export default function BrandDashboardNotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
        <div className="text-6xl font-extrabold tracking-tighter text-black">
          404
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard Resource Not Found
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            The merchant section, inventory item, or storefront slug you are attempting to access does not exist.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/">
            <Button
              className="w-full bg-black hover:bg-gray-800 text-white font-medium shadow-lg shadow-black/10"
            >
              Return to Brand Overview
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
