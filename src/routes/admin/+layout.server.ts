import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

// Layout server load function for all admin pages
export const load: LayoutServerLoad = async ({ locals, request }) => {
    // Check if user is authenticated via the locals object that was set in hooks.server.ts
    console.log('Locals:', locals);
    console.log('User in locals:', locals.user?.email);
    console.log('Admin status in locals:', locals.isAdmin);
    
    // Additional debug info
    if (locals.userId) {
        console.log('User ID in locals:', locals.userId);
    }

    if (!locals.user) {
        console.log('User not authenticated via server hooks. Checking Authorization header...');
        
        // Try to get the JWT token from the Authorization header
        const authHeader = request.headers.get('Authorization');
        let token;
        
        if (authHeader) {
            token = authHeader.replace('Bearer ', '');
            console.log('Found Authorization header token');
            
            try {
                // Validate the token and get user info
                const { data: { user }, error } = await supabase.auth.getUser(token);
                
                if (error || !user) {
                    console.log('Invalid token in Authorization header:', error);
                    throw redirect(302, '/');
                } else {
                    console.log('Valid user found from Authorization header:', user.email);
                    locals.user = user;
                }
            } catch (err) {
                console.error('Error validating token:', err);
                throw redirect(302, '/');
            }
        } else {
            // No Authorization header found
            console.log('No Authorization header found. Redirecting to homepage.');
            throw redirect(302, '/');
        }

        // At this point, locals.user should be set if a valid token was provided
        if (!locals.user) {
            console.log('Failed to authenticate user. Redirecting to homepage.');
            throw redirect(302, '/');
        }

        // We need to check admin status for this user since we didn't go through the hooks
        console.log("Checking admin status for user:", locals.user.email);
        
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
            console.log('Access denied: User does not have admin privileges');
            throw redirect(302, '/');
        }

        // Set admin status in locals for future requests in this session
        locals.isAdmin = true;
        
        console.log("Admin status verified with direct DB check, allowing access");
        
        // Return data for the authenticated user
        return {
            user: locals.user,
            isAdmin: true
        };
    }

    // If we get here, the user is already authenticated via locals
    console.log("User is authenticated through locals:", locals.user?.email);
    console.log("Admin status from locals:", locals.isAdmin);

    // If locals already indicates admin status, we can trust that
    if (locals.isAdmin === true) {
        console.log("User has admin privileges via locals - allowing access");
        return {
            user: locals.user,
            isAdmin: true
        };
    }
    
    // If locals doesn't indicate admin status, double-check with Supabase
    console.log("Double-checking admin status with Supabase");
    
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
        console.log('Access denied: User does not have admin privileges');
        throw redirect(302, '/');
    }

    // Return data for the layout using the admin status we verified
    console.log("Admin status verified with database check, allowing access");
    return {
        user: locals.user,
        isAdmin: true
    };
};
