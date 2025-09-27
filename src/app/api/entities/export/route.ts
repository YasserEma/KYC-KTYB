import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/route-handler';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    
    // Create Supabase client
    const { supabase } = createClient(request);
    
    // Get tenant and user context
    const tenantId = request.headers.get('x-tenant-id');
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    if (!tenantId || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Build query
    let query = supabase
      .from('entities')
      .select(`
        id,
        name,
        status,
        type,
        nationality_codes,
        government_id,
        created_at,
        profiles!created_by(full_name)
      `);
    
    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,government_id.ilike.%${search}%`);
    }
    
    if (status) {
      query = query.eq('status', status as "ACTIVE" | "INACTIVE");
    }
    
    if (type) {
      query = query.eq('type', type as "INDIVIDUAL" | "ORGANIZATION");
    }
    
    // Execute query with sorting by created_at
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching entities for export:', error);
      return NextResponse.json(
        { error: 'Failed to fetch entities' },
        { status: 500 }
      );
    }
    
    // Format data for CSV
    const formattedData = data.map((entity) => ({
      id: entity.id,
      name: entity.name,
      status: entity.status,
      type: entity.type,
      nationality: entity.nationality_codes ? entity.nationality_codes.join(', ') : '',
      government_id: entity.government_id || '',
      created_at: new Date(entity.created_at).toISOString(),
      created_by: entity.profiles?.full_name || '',
    }));
    
    // Convert to CSV
    const headers = [
      'ID',
      'Name',
      'Status',
      'Type',
      'Nationality',
      'Government ID',
      'Created At',
      'Created By',
    ];
    
    const csvRows = [
      headers.join(','),
      ...formattedData.map((row) => 
        headers
          .map((header) => {
            const key = header.toLowerCase().replace(/ /g, '_');
            const value = row[key as keyof typeof row];
            // Escape commas and quotes in values
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];
    
    const csv = csvRows.join('\n');
    
    // Log the export to audit_logs
    const filterDescription = [
      search ? `search: ${search}` : null,
      status ? `status: ${status}` : null,
      type ? `type: ${type}` : null,
    ]
      .filter(Boolean)
      .join(', ');
    
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      action: 'EXPORT_ENTITIES',
      resource_type: 'entities',
      description: `Exported entities CSV${filterDescription ? ` with filters: ${filterDescription}` : ''}`,
      metadata: {
        filters: {
          search,
          status,
          type,
        },
        record_count: formattedData.length,
      },
    }).select();
    
    // Set response headers for CSV download
    const filename = `entities-export-${new Date().toISOString().split('T')[0]}.csv`;
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error in CSV export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}