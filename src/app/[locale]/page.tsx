import { getTranslations } from 'next-intl/server';
import { getTenantContext } from '@/lib/supabase/server';

export default async function TenantDashboard() {
  const t = await getTranslations('dashboard');
  const tenantContext = await getTenantContext();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('welcome')}
          </h1>
          {tenantContext?.tenantSlug && (
            <p className="text-lg text-gray-600 mb-6">
              Tenant: {tenantContext.tenantSlug}
            </p>
          )}
          <p className="text-gray-500">
            {t('description')}
          </p>
        </div>
      </div>
    </div>
  );
}