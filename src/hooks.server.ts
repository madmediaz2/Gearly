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
				'sb-auth-token',
				'supabase_auth_token', // Added this based on the localStorage key
				'sb:token',
				'sb-auth',
				'sb-provider-token',
				'__session'
			];
			
			for (const cookieName of possibleCookieNames) {
				const cookieValue = cookies.get(cookieName);
				if (cookieValue) {
					try {
						// Cookie might be JSON with structure like ["token", ...other data]
						const parsed = JSON.parse(cookieValue);
						if (Array.isArray(parsed) && parsed.length > 0) {
							token = parsed[0]; // Usually first item is token
						} else if (parsed && typeof parsed === 'object' && parsed.access_token) {
							// Handle case where it's an object with access_token property
							token = parsed.access_token;
						} else {
							token = cookieValue;
						}
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
		
		// 4. Check for a custom header used for cross-domain requests
		if (!token) {
			const customAuthHeader = event.request.headers.get('X-Auth-Token');
			if (customAuthHeader) {
				token = customAuthHeader;
			}
		}
		

		// Verify the JWT token and get user data
		if (!token) {
			// No token found, continue without authentication
			return await resolve(event);
		}
		
		
		try {
			// First try with the getUser API which accepts a token directly
			const { data, error } = await supabase.auth.getUser(token);
			
			if (error || !data.user) {
				
				// If that fails, try setting the session first 
				const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
					access_token: token,
					refresh_token: '' // We may not have the refresh token here
				});
				
				if (sessionError || !sessionData.user) {
					// Continue without authentication since token is invalid
					return await resolve(event);
				}
				
				// Session approach worked
				event.locals.user = sessionData.user;
			} else {
				// Original approach worked
				event.locals.user = data.user;
			}
		} catch (error) {
			console.error('Unexpected auth error:', error);
			return await resolve(event);
		}

		// Use the event.locals.user that was set earlier
		if (event.locals.user) {
			const user = event.locals.user;
			console.log('User authenticated:', user.email);
			
			// Check admin status
			const { data: adminData, error: adminError } = await supabase
				.from('user_roles')
				.select('is_admin')
				.eq('user_id', user.id)
				.maybeSingle();

			console.log("Admin data for user:", adminData);
			
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