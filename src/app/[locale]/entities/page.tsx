import { createClient } from '@/lib/supabase/server';
import { PostgrestError } from '@supabase/supabase-js';
import { EntitiesTable } from './database-table';


export interface Entity {
  id: string;                // UUID (string)
  reference_id: string;      // e.g. "IND-001"
  type: string;              // "INDIVIDUAL" | "ORGANIZATION" | other strings
  first_name: string | null;
  last_name: string | null;
  legal_name: string | null; // for companies, might be null for individuals
  registration_number: string | null; // for ORGs, may be null
  email: string | null;
  phone: string | null;
  created_at: string;        // ISO 8601 datetime string
  created_by: string | null; // user id that created the record

  // relations
  profiles?: {
    full_name: string | null;
  } | null;

  countries?: {
    name: string | null;
  } | null;

  incorporation_countries?: {
    name: string | null;
  } | null;
}
// ====================================================================
// 1. YOUR DATA FETCHING FUNCTION (No changes needed here)
// ====================================================================
type GetEntitiesResult = {
  data: Entity[] | null;
  error: PostgrestError | null;
};

export async function getEntities(): Promise<GetEntitiesResult> {
  try {
    const supabase = await createClient();
    const tenantId = '11111111-1111-1111-1111-111111111111'; // Using a fixed tenant ID
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log(user?.user_metadata?.display_name)
    if (authError || !user) {
      console.error('Authentication error in EntitiesPage:', authError);
      // Redirect to login page
      throw new Error('User not authenticated');
    }
    const { data, error } = await supabase
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


    if (error) {
      console.error('Supabase Query Error:', error.message);
    }
    return { data, error };
  } catch (e) {
    console.error('An unexpected error occurred while fetching entities:', e);
    return { data: null, error: e as PostgrestError };
  }
}


// ====================================================================
// 2. YOUR HOME COMPONENT (Updated to fetch and display data)
//    This is a Server Component, so we can make it async.
// ====================================================================
const Home = async () => {
  // Fetch data directly on the server when the page loads
  const { data: entities, error } = await getEntities();
  console.log(entities)
  // Handle the error state
  if (error) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Failed to Load Entities</h1>
          <p className="text-gray-500 mt-2">{error.message}</p>
        </div>
      </main>
    );
  }

  // Handle the case where no data is found
  if (!entities || entities.length === 0) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">No Entities Found</h1>
          <p className="text-gray-500 mt-2">There is no data to display at the moment.</p>
        </div>
      </main>
    );
  }

  // Render the list of entities if data exists
  return (
    <main className="w-full ">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Entities List</h1>
      <div className="w-full">
        <EntitiesTable data={entities} />


      </div>
    </main>
  );
};

export default Home;