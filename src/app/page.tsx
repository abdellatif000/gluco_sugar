
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/app-context';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { authState } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (authState === 'loggedIn') {
      router.replace('/dashboard');
    } else if (authState === 'loggedOut') {
      router.replace('/login');
    }
  }, [authState, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
