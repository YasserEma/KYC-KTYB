import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/route-handler';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[CSV Export] Starting export process...');
  console.log('[CSV Export] Request URL:', request.url);
  console.log('[CSV Export] Request method:', request.method);
  
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    
    console.log('[CSV Export] Filters applied:', { search, status, type });
    console.log('[CSV Export] All query parameters:', Object.fromEntries(searchParams.entries()));
    
    // Log all request headers for debugging
    const headers = Object.fromEntries(request.headers.entries());
    console.log('[CSV Export] Request headers:', headers);
    
    // Create Supabase client
    console.log('[CSV Export] Creating Supabase client...');
    const { supabase } = createClient(request);
    console.log('[CSV Export] Supabase client created successfully');
    
    // Get tenant and user context
    const tenantId = request.headers.get('x-tenant-id');
    console.log('[CSV Export] Getting user authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const userId = user?.id;
    
    console.log('[CSV Export] User context:', { 
      tenantId, 
      userId: userId ? 'authenticated' : 'not authenticated',
      userEmail: user?.email || 'no email',
      authError: authError ? authError.message : 'none'
    });
    
    if (!tenantId || !userId) {
      console.error('[CSV Export] Unauthorized access attempt - missing tenantId or userId');
      console.error('[CSV Export] TenantId present:', !!tenantId);
      console.error('[CSV Export] UserId present:', !!userId);
      console.error('[CSV Export] Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Build query with correct schema
    let query = supabase
      .from('entities')
      .select(`
        id,
        reference_id,
        type,
        first_name,
        middle_name,
        last_name,
        legal_name,
        trade_name,
        registration_number,
        date_of_birth,
        place_of_birth,
        incorporation_date,
        address_line1,
        address_line2,
        city,
        state_province,
        postal_code,
        phone,
        email,
        notes,
        created_at,
        updated_at,
        countries!nationality_id(name, alpha2),
        countries!incorporation_country_id(name, alpha2),
        countries!country_id(name, alpha2),
        profiles!created_by(full_name)
      `)
      .eq('tenant_id', tenantId);
    
    console.log('[CSV Export] Base query built with tenant filter');
    
    // Apply filters
    if (search) {
      // Search in names, reference_id, and email
      const searchFilter = type === 'INDIVIDUAL' 
        ? `first_name.ilike.%${search}%,last_name.ilike.%${search}%,reference_id.ilike.%${search}%,email.ilike.%${search}%`
        : `legal_name.ilike.%${search}%,trade_name.ilike.%${search}%,reference_id.ilike.%${search}%,email.ilike.%${search}%`;
      
      query = query.or(searchFilter);
      console.log('[CSV Export] Search filter applied:', search);
    }
    
    if (type) {
      query = query.eq('type', type as "INDIVIDUAL" | "ORGANIZATION");
      console.log('[CSV Export] Type filter applied:', type);
    }
    
    // Execute query with sorting by created_at
    console.log('[CSV Export] Executing database query...');
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('[CSV Export] Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch entities' },
        { status: 500 }
      );
    }
    
    console.log(`[CSV Export] Query successful, found ${data?.length || 0} entities`);
    
    // Format data for CSV
    console.log('[CSV Export] Formatting data for CSV...');
    const formattedData = data.map((entity) => {
      // Determine name based on entity type
      const name = entity.type === 'INDIVIDUAL' 
        ? [entity.first_name, entity.middle_name, entity.last_name].filter(Boolean).join(' ')
        : entity.legal_name || entity.trade_name || '';
      
      // Get nationality information
      const nationality = entity.countries?.name || '';
      const nationalityCode = entity.countries?.alpha2 || '';
      
      // Get incorporation country for organizations
      const incorporationCountry = entity.type === 'ORGANIZATION' && entity.countries 
        ? entity.countries.name || '' 
        : '';
      
      // Get address
      const address = [
        entity.address_line1,
        entity.address_line2,
        entity.city,
        entity.state_province,
        entity.postal_code
      ].filter(Boolean).join(', ');
      
      return {
        id: entity.id,
        reference_id: entity.reference_id || '',
        type: entity.type,
        name: name,
        first_name: entity.first_name || '',
        middle_name: entity.middle_name || '',
        last_name: entity.last_name || '',
        legal_name: entity.legal_name || '',
        trade_name: entity.trade_name || '',
        registration_number: entity.registration_number || '',
        date_of_birth: entity.date_of_birth || '',
        place_of_birth: entity.place_of_birth || '',
        incorporation_date: entity.incorporation_date || '',
        nationality: nationality,
        nationality_code: nationalityCode,
        incorporation_country: incorporationCountry,
        address: address,
        phone: entity.phone || '',
        email: entity.email || '',
        notes: entity.notes || '',
        created_at: new Date(entity.created_at).toISOString(),
        updated_at: entity.updated_at ? new Date(entity.updated_at).toISOString() : '',
        created_by: entity.profiles?.full_name || '',
      };
    });
    
    console.log(`[CSV Export] Formatted ${formattedData.length} records for CSV`);
    
    // Convert to CSV
    const csvHeaders = [
      'ID',
      'Reference ID',
      'Type',
      'Name',
      'First Name',
      'Middle Name',
      'Last Name',
      'Legal Name',
      'Trade Name',
      'Registration Number',
      'Date of Birth',
      'Place of Birth',
      'Incorporation Date',
      'Nationality',
      'Nationality Code',
      'Incorporation Country',
      'Address',
      'Phone',
      'Email',
      'Notes',
      'Created At',
      'Updated At',
      'Created By',
    ];
    
    console.log('[CSV Export] Converting to CSV format...');
    const csvRows = [
      csvHeaders.join(','),
      ...formattedData.map((row) => 
        csvHeaders
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
    console.log(`[CSV Export] CSV generated with ${csvRows.length - 1} data rows`);
    
    // Log the export to audit_logs
    console.log('[CSV Export] Logging export action to audit_logs...');
    const filterDescription = [
      search ? `search: ${search}` : null,
      type ? `type: ${type}` : null,
    ]
      .filter(Boolean)
      .join(', ');
    
    const auditLogData = {
      tenant_id: tenantId,
      user_id: userId,
      action: 'EXPORT_ENTITIES',
      resource_type: 'entities',
      description: `Exported entities CSV${filterDescription ? ` with filters: ${filterDescription}` : ''}`,
      metadata: {
        filters: {
          search,
          type,
        },
        record_count: formattedData.length,
        export_timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      },
    };
    
    try {
      const { error: auditError } = await supabase.from('audit_logs').insert(auditLogData);
      if (auditError) {
        console.error('[CSV Export] Failed to log audit entry:', auditError);
        // Continue with export even if audit logging fails
      } else {
        console.log('[CSV Export] Audit log entry created successfully');
      }
    } catch (auditLogError) {
      console.error('[CSV Export] Exception while logging audit entry:', auditLogError);
      // Continue with export even if audit logging fails
    }
    
    // Set response headers for CSV download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `entities-export-${timestamp}.csv`;
    
    console.log(`[CSV Export] Export completed successfully in ${Date.now() - startTime}ms`);
    console.log(`[CSV Export] Filename: ${filename}, Records: ${formattedData.length}`);
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[CSV Export] Error in CSV export after ${processingTime}ms:`, error);
    
    // Try to log the error to audit_logs
    try {
      const { supabase } = createClient(request);
      const tenantId = request.headers.get('x-tenant-id');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (tenantId && user?.id) {
        await supabase.from('audit_logs').insert({
          tenant_id: tenantId,
          user_id: user.id,
          action: 'EXPORT_ENTITIES_FAILED',
          resource_type: 'entities',
          description: `Failed to export entities CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            processing_time_ms: processingTime,
          },
        });
      }
    } catch (auditError) {
      console.error('[CSV Export] Failed to log error to audit_logs:', auditError);
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}