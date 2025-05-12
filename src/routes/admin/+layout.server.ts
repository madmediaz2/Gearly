import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

// Layout server load function for all admin pages
export const load: LayoutServerLoad = async ({ locals, request }) => {
    if (!locals.user) {
        console.log('User not authenticated via server hooks. Checking Authorization header...');
        
        const authHeader = request.headers.get('Authorization');
        let token;
        
        if (authHeader) {
            token = authHeader.replace('Bearer ', '');
            
            try {
                // Validate the token and get user info
                const { data: { user }, error } = await supabase.auth.getUser(token);
                
                if (error || !user) {
                    throw redirect(302, '/');
                } else {
                    locals.user = user;
                }
            } catch (err) {
                console.error('Error validating token:', err);
                throw redirect(302, '/');
            }
        } else {
            // No Authorization header found
            throw redirect(302, '/');
        }

        // At this point, locals.user should be set if a valid token was provided
        if (!locals.user) {
            throw redirect(302, '/');
        }

        // We need to check admin status for this user since we didn't go through the hooks
        
        const { data: userData, error: userError } = await supabase
            .from('user_roles')
            .select('is_admin')
            .eq('user_id', locals.user.id)
            .maybeSingle();

        if (userError) {
            console.error('Error checking admin status:', userError);
            throw redirect(302, '/');
        }

        // If no role entry or not admin, redirect
        if (!userData?.is_admin) {
            throw redirect(302, '/');
        }

        // Set admin status in locals for future requests in this session
        locals.isAdmin = true;
                
        // Return data for the authenticated user
        return {
            user: locals.user,
            isAdmin: true
        };
    }

    // If locals already indicates admin status, we can trust that
    if (locals.isAdmin === true) {
        return {
            user: locals.user,
            isAdmin: true
        };
    }
    
    
    // Check if the user has the admin role using Supabase
    const { data: userData, error: userError } = await supabase
        .from('user_roles')
        .select('is_admin')
        .eq('user_id', locals.user.id)
        .maybeSingle();

    if (userError) {
        console.error('Error checking admin status:', userError);
        throw redirect(302, '/');
    }

    // If no role entry or not admin, redirect
    if (!userData?.is_admin) {
        throw redirect(302, '/');
    }

    // Return data for the layout using the admin status we verified
    return {
        user: locals.user,
        isAdmin: true
    };
};
