'use client';

import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClientWithTenant } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('entities');
  const tAuth = useTranslations('auth');

  const handleSignOut = async () => {
    try {
      const supabase = await createClientWithTenant();
      await supabase.client.auth.signOut();
      router.push(`/${locale}/auth/login`);
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (

    <button
      onClick={handleSignOut}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
    >
      <LogOut className="w-4 h-4 mr-2"
      />

      {tAuth('signOut')}
    </button>
  );
}