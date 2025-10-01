import { Header } from '@/components/Header';
import { Sidebar } from '@/components/sidbar/Sidebar';

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function TenantLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className='w-full'>
          <Header title='ComplianceHub
' />

          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>

      </div>

    </NextIntlClientProvider>
  );
}