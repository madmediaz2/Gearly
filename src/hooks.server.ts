import type { Handle } from '@sveltejs/kit';
import { supabaseAdmin as supabase } from '$lib/supabaseClient';

export const handle: Handle = async ({ event, resolve }) => {
	try {
		// Initialize locals
		event.locals = {
			user: undefined,
			isAdmin: false
		};

		// Try to get JWT token from different sources
		let token: string | undefined = undefined;

		// 1. Try Authorization header first
		const authHeader = event.request.headers.get('Authorization');
		if (authHeader) {
			token = authHeader.replace('Bearer ', '');
		}

		// 2. Try cookies
		const cookies = event.cookies;
		if (!token) {
			// Try standard Supabase cookie names
			const possibleCookieNames = [
				'supabase-auth-token',
				'sb-access-token',
				'supabase_access_token',
				'sb-auth-token'
			];

			for (const cookieName of possibleCookieNames) {
				const cookieValue = cookies.get(cookieName);
				if (cookieValue) {
					try {
						// Cookie might be JSON with structure like ["token", ...other data]
						const parsed = JSON.parse(cookieValue);
						token = parsed[0]; // Usually first item is token
						break;
					} catch {
						// If not JSON, use directly
						token = cookieValue;
						break;
					}
				}
			}
		}

		// 3. For API routes, also check query params (useful for some integrations)
		if (!token && event.url.searchParams.has('access_token')) {
			token = event.url.searchParams.get('access_token') || undefined;
		}

		// Verify the JWT token and get user data
		if (!token) {
			// No token found, continue without authentication
			return await resolve(event);
		}

		// Now get the user with the established session
		const { data: { user }, error } = await supabase.auth.getUser(token);
		if (error) {
			console.error('Auth error:', error);
			return await resolve(event);
		}

		if (user) {
			// Set the user in locals
			event.locals.user = user;

			// Check admin status
			const { data: adminData, error: adminError } = await supabase
				.from('user_roles')
				.select('is_admin')
				.eq('user_id', user.id)
				.maybeSingle();

			if (adminError) {
				console.error('Error checking admin status:', adminError);
				throw adminError;
			}

			event.locals.isAdmin = adminData?.is_admin === true;

			// Set debug values for layout server to check
			event.locals.userEmail = user.email;
			event.locals.userId = user.id;
		}
	} catch (e) {
		console.error('Hook error:', e);
		// Continue with the request even if there was an error in authentication
	}

	// Always return the result of resolve(event)
	return await resolve(event);
};