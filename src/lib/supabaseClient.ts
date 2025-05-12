import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit'
      }
});

export const createAdminClient = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceRoleKey) {
        console.error('Missing service role key for admin operations');
        throw new Error('Admin operations unavailable');
    }
    
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'implicit',
          }
    });
};

export const supabaseAdmin = createAdminClient();

export * from './api/supabaseApi';
