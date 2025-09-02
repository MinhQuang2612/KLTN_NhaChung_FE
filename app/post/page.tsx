"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PostPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to rent page by default
    router.replace('/post/rent');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
