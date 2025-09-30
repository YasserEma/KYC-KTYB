import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { getTenantContext, createClient } from '@/lib/supabase/server';
import EntitiesClient from './EntitiesClient';
import EntitiesHeader from './EntitiesHeader';

// Types for entity data
type Entity = {
  id: string;
  name: string;
  status: string;
  type: string;
  nationality_codes: string[] | null;
  government_id: string | null;
  created_at: string;
  created_by: string;
};

// Server component to fetch entities data
async function EntitiesData({
  page = 1,
  pageSize = 10,
  sortBy = 'created_at',
  sortDirection = 'desc',
  search = '',
  status = '',
  type = '',
}: {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
  status?: string;
  type?: string;
}) {
  const tenantContext = await getTenantContext();
  
  // For development, use default tenant if context is not available
  let tenantId = tenantContext?.tenantId;
  if (!tenantId) {
    // Use the demo tenant ID for development
    tenantId = '11111111-1111-1111-1111-111111111111';
    console.log('Using default tenant ID for development:', tenantId);
  }

  const supabase = await createClient();
  
  // Check user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Authentication error in EntitiesData:', authError);
    throw new Error('User not authenticated');
  }
  
  console.log('User authenticated:', user.email);
  
  // Build query with proper field selection
  let query = supabase
    .from('entities')
    .select(`
      id,
      type,
      reference_id,
      first_name,
      last_name,
      legal_name,
      registration_number,
      email,
      phone,
      created_at,
      created_by,
      profiles!created_by(full_name),
      countries!nationality_id(name),
      incorporation_countries:countries!incorporation_country_id(name)
    `, { count: 'exact' })
    .eq('tenant_id', tenantId);
  
  // Apply filters
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,legal_name.ilike.%${search}%,registration_number.ilike.%${search}%,email.ilike.%${search}%`);
  }
  
  if (type) {
    query = query.eq('type', type);
  }
  
  // Apply pagination and sorting
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data, count, error } = await query
    .order(sortBy, { ascending: sortDirection === 'asc' })
    .range(from, to);
  
  if (error) {
    console.error('Error fetching entities:', error);
    throw new Error('Failed to fetch entities');
  }
  
  // Format data for the table
  const formattedData = data?.map((entity: any) => ({
    id: entity.id,
    name: entity.type === 'INDIVIDUAL' 
      ? `${entity.first_name || ''} ${entity.last_name || ''}`.trim() 
      : entity.legal_name || '',
    status: 'ACTIVE', // Default status since we don't have this field
    type: entity.type,
    nationality: entity.countries?.name || entity.incorporation_countries?.name || '',
    government_id: entity.registration_number || entity.reference_id || '',
    created_at: new Date(entity.created_at).toLocaleString(),
    created_by: entity.profiles?.full_name || '',
  })) || [];
  
  return {
    data: formattedData,
    totalCount: count || 0,
  };
}

export default async function EntitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    search?: string;
    status?: string;
    type?: string;
    view?: string;
  }>;
}) {
  const t = await getTranslations('entities');
  const tenantContext = await getTenantContext();
  
  // Parse search params - await once to fix dynamic API usage
  const params = await searchParams;
  const page = params?.page ? parseInt(params.page) : 1;
  const pageSize = params?.pageSize ? parseInt(params.pageSize) : 10;
  const sortBy = params?.sortBy || 'created_at';
  const sortDirection = params?.sortDirection || 'desc';
  const search = params?.search || '';
  const status = params?.status || '';
  const type = params?.type || '';
  const viewEntityId = params?.view;
  
  // Create supabase client for fetching filter options
  const supabase = await createClient();
  
  // Check user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Authentication error in EntitiesPage:', authError);
    // Redirect to login page
    throw new Error('User not authenticated');
  }
  
  // Get entity status and type options for filters
  const { data: statusOptions } = await supabase
    .from('list_values')
    .select('key, label')
    .eq('list_id', 'entity_status_list')
    .eq('status', 'ACTIVE')
    .order('order');
  
  const { data: typeOptions } = await supabase
    .from('list_values')
    .select('key, label')
    .eq('list_id', 'entity_type_list')
    .eq('status', 'ACTIVE')
    .order('order');
  
  // Fetch entities data
  const entitiesPromise = EntitiesData({
    page,
    pageSize,
    sortBy,
    sortDirection: sortDirection as 'asc' | 'desc',
    search,
    status,
    type,
  });
  
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <EntitiesHeader />
      
      <Suspense fallback={<div className="text-center py-10">Loading entities...</div>}>
        <EntitiesClient
          entitiesPromise={entitiesPromise}
          statusOptions={statusOptions || []}
          typeOptions={typeOptions || []}
          initialParams={{
            page,
            pageSize,
            sortBy,
            sortDirection: sortDirection as 'asc' | 'desc',
            search,
            status,
            type,
          }}
          viewEntityId={viewEntityId}
        />
      </Suspense>
    </div>
  );
}