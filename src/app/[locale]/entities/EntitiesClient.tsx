'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BusinessTable from '@/components/ui/BusinessTable';
import EntityDetailsDrawer from './EntityDetailsDrawer';
import { createClientWithTenant } from '@/lib/supabase/client';

type EntitiesClientProps = {
  entitiesPromise: Promise<{
    data: any[];
    totalCount: number;
  }>;
  statusOptions: { key: string; label: string }[];
  typeOptions: { key: string; label: string }[];
  initialParams: {
    page: number;
    pageSize: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    search: string;
    status: string;
    type: string;
  };
  viewEntityId?: string;
};

export default function EntitiesClient({
  entitiesPromise,
  statusOptions,
  typeOptions,
  initialParams,
  viewEntityId,
}: EntitiesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entities, setEntities] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(!!viewEntityId);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(viewEntityId || null);
  
  // Initialize data from promise
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, totalCount } = await entitiesPromise;
        setEntities(data);
        setTotalCount(totalCount);
      } catch (error) {
        console.error('Error fetching entities:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [entitiesPromise]);
  
  // Update URL when drawer state changes
  useEffect(() => {
    if (selectedEntity && isDrawerOpen) {
      updateUrl({ view: selectedEntity });
    } else if (!isDrawerOpen) {
      // Check if view parameter exists in current URL
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('view')) {
        updateUrl({ view: null });
      }
    }
  }, [selectedEntity, isDrawerOpen]);
  
  // Listen for Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);
  
  // Table columns configuration
  const columns = [
    {
      id: 'id',
      label: '#',
      sortable: false,
      renderCell: (row: any) => row.id.substring(0, 8),
    },
    {
      id: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      renderCell: (row: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
          row.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          row.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      sortable: true,
      renderCell: (row: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
          {row.type}
        </span>
      ),
    },
    {
      id: 'nationality',
      label: 'Nationality',
      sortable: false,
    },
    {
      id: 'government_id',
      label: 'Government ID',
      sortable: false,
    },
    {
      id: 'created_at',
      label: 'Created At',
      sortable: true,
    },
    {
      id: 'created_by',
      label: 'Created By',
      sortable: false,
    },
  ];
  
  // Filter options for the table
  const filterOptions = {
    status: {
      label: 'Status',
      options: statusOptions.map(option => ({
        value: option.key,
        label: option.label,
      })),
    },
    type: {
      label: 'Type',
      options: typeOptions.map(option => ({
        value: option.key,
        label: option.label,
      })),
    },
  };
  
  // Update URL with current state
  const updateUrl = (params: Record<string, string | number | null>) => {
    const url = new URL(window.location.href);
    
    // Update existing params
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, String(value));
      }
    });
    
    router.push(url.pathname + url.search);
  };
  
  // Table event handlers
  const handlePageChange = (page: number) => {
    updateUrl({ page });
    refreshData();
  };
  
  const handlePageSizeChange = (pageSize: number) => {
    updateUrl({ pageSize, page: 1 });
    refreshData();
  };
  
  const handleSortChange = (sortBy: string, sortDirection: 'asc' | 'desc') => {
    updateUrl({ sortBy, sortDirection });
    refreshData();
  };
  
  const handleSearch = (query: string) => {
    updateUrl({ search: query, page: 1 });
    refreshData();
  };
  
  const handleFilterChange = (filters: Record<string, string>) => {
    // Update all filters at once
    const newParams: Record<string, string | number | null> = { page: 1 };
    Object.entries(filters).forEach(([key, value]) => {
      newParams[key] = value || null;
    });
    
    updateUrl(newParams);
    refreshData();
  };
  
  const handleExport = async () => {
    console.log('[CSV Export Client] Starting export process...');
    
    try {
      // Get current filters from URL
      const currentParams = Object.fromEntries(searchParams.entries());
      console.log('[CSV Export Client] Current URL params:', currentParams);
      
      // Build query string for export
      const queryParams = new URLSearchParams(currentParams);
      console.log('[CSV Export Client] Query string for export:', queryParams.toString());
      
      // Get Supabase client with tenant context
      const { client: supabase } = createClientWithTenant();
      console.log('[CSV Export Client] Supabase client created');
      
      // Get tenant ID from hostname
      const hostname = window.location.hostname;
      const tenantSlug = hostname.split('.')[0];
      console.log('[CSV Export Client] Hostname:', hostname, 'Tenant slug:', tenantSlug);
      
      // For local development, use 'acme' as default tenant
      const effectiveSlug = hostname === 'localhost' ? 'acme' : tenantSlug;
      console.log('[CSV Export Client] Effective tenant slug:', effectiveSlug);
      
      let tenantId = null;
      if (effectiveSlug) {
        console.log('[CSV Export Client] Fetching tenant data for slug:', effectiveSlug);
        // Fetch tenant data to get the ID
        const { data, error } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', effectiveSlug)
          .single();
          
        console.log('[CSV Export Client] Tenant query result:', { data, error });
          
        if (data && !error) {
          tenantId = data.id;
          console.log('[CSV Export Client] Tenant ID found:', tenantId);
        } else {
          console.error('[CSV Export Client] Failed to get tenant ID:', error);
        }
      }
      
      if (!tenantId) {
        console.error('[CSV Export Client] No tenant ID available');
        alert('Unable to determine tenant context. Please try again.');
        return;
      }
      
      console.log('[CSV Export Client] Logging export action to audit_logs...');
      // Log the export action to audit_logs
      try {
        await supabase.from('audit_logs').insert({
          action: 'EXPORT_ENTITIES',
          details: {
            filters: {
              search: searchParams.get('search') || '',
              status: searchParams.get('status') || '',
              type: searchParams.get('type') || '',
            }
          }
        });
        console.log('[CSV Export Client] Audit log created successfully');
      } catch (auditError) {
        console.error('[CSV Export Client] Failed to create audit log:', auditError);
        // Continue with export even if audit logging fails
      }
      
      // Get the session for authentication
      console.log('[CSV Export Client] Getting user session...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('[CSV Export Client] No user session found');
        alert('You must be logged in to export data.');
        return;
      }
      
      console.log('[CSV Export Client] User session found, user ID:', session.user?.id);
      console.log('[CSV Export Client] Making request to export API...');
      
      // Make authenticated request to export API
      const exportUrl = `/api/entities/export?${queryParams.toString()}`;
      console.log('[CSV Export Client] Export URL:', exportUrl);
      
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json',
      };
      console.log('[CSV Export Client] Request headers:', headers);
      
      const response = await fetch(exportUrl, {
        method: 'GET',
        headers,
      });
      
      console.log('[CSV Export Client] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CSV Export Client] Export failed with error:', errorText);
        throw new Error(`Export failed: ${response.statusText} - ${errorText}`);
      }
      
      // Get the CSV content
      console.log('[CSV Export Client] Getting CSV content from response...');
      const csvContent = await response.text();
      console.log('[CSV Export Client] CSV content length:', csvContent.length);
      console.log('[CSV Export Client] CSV content preview (first 200 chars):', csvContent.substring(0, 200));
      
      // Create and trigger download
      console.log('[CSV Export Client] Creating download blob...');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const filename = `entities-export-${new Date().toISOString().split('T')[0]}.csv`;
      
      console.log('[CSV Export Client] Triggering download with filename:', filename);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('[CSV Export Client] Export completed successfully');
      
    } catch (error) {
      console.error('[CSV Export Client] Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };
  
  const handleRowClick = (row: any) => {
    setSelectedEntity(row.id);
    setIsDrawerOpen(true);
  };
  
  // Refresh data from server
  const refreshData = async () => {
    setLoading(true);
    
    // Get current params from URL
    const page = Number(searchParams.get('page') || initialParams.page);
    const pageSize = Number(searchParams.get('pageSize') || initialParams.pageSize);
    const sortBy = searchParams.get('sortBy') || initialParams.sortBy;
    const sortDirection = (searchParams.get('sortDirection') || initialParams.sortDirection) as 'asc' | 'desc';
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    
    // Fetch data from API
    const supabase = await createClientWithTenant();
    
    // Build query with proper field selection
    let query = supabase.client
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
      .eq('tenant_id', '11111111-1111-1111-1111-111111111111'); // Use default tenant for development
    
    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,legal_name.ilike.%${search}%,registration_number.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    if (type) {
      query = query.eq('type', type as "INDIVIDUAL" | "ORGANIZATION");
    }
    
    // Apply pagination and sorting
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Execute query
    const { data, count, error }: { data: any[]; count: number | null; error: any } = await query
      .order(sortBy, { ascending: sortDirection === 'asc' })
      .range(from, to);
      
    if (error) {
      console.error('Error fetching entities:', error);
      setEntities([]);
      setTotalCount(0);
      setLoading(false);
      return;
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
    
    setEntities(formattedData);
    setTotalCount(count || 0);
    setLoading(false);
  };
  
  return (
    <div className="relative">
      <BusinessTable
        data={entities}
        columns={columns}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSortChange={handleSortChange}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        onRowClick={handleRowClick}
        loading={loading}
        filterOptions={filterOptions}
        createNewPath="/entities/new"
      />
      
      {isDrawerOpen && selectedEntity && (
        <EntityDetailsDrawer
          entityId={selectedEntity}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}
    </div>
  );
}