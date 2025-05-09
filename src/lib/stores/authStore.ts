import { writable, get } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export const user = writable<User | null>(null);
export const isLoading = writable<boolean>(true);
export const token = writable<string | null>(null); // Access token
export const refreshToken = writable<string | null>(null); // Refresh token

// Admin related stores
export const isAdmin = writable<boolean>(false);
export const isAdminLoading = writable<boolean>(false);
export const adminCheckError = writable<string | null>(null);

// Get the current access token value
export function getToken(): string | null {
    return get(token);
}

// Get the current refresh token value
export function getRefreshToken(): string | null {
    return get(refreshToken);
}

// Set a new token value
export function setToken(newToken: string | null, newRefreshToken: string | null = null): void {
    token.set(newToken);
    if (newRefreshToken !== null) {
        refreshToken.set(newRefreshToken);
    }
    
    if (typeof localStorage !== 'undefined') {
        if (newToken) {
            localStorage.setItem('supabase_access_token', newToken);
            
            // Also set a cookie for server-side authentication
            document.cookie = `supabase-auth-token=${newToken}; path=/; max-age=3600; SameSite=Lax`;
        } else {
            localStorage.removeItem('supabase_access_token');
            
            // Clear the cookie when logging out
            document.cookie = 'supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        
        if (newRefreshToken) {
            localStorage.setItem('supabase_refresh_token', newRefreshToken);
        } else if (newRefreshToken === null && !newToken) {
            // Only clear refresh token if explicitly passing null and clearing access token
            localStorage.removeItem('supabase_refresh_token');
        }
    }
}

export async function initializeAuth() {
    try {
        isLoading.set(true);
        
        // Check if we have a stored JWT token
        let savedToken: string | null = null;
        
        if (typeof localStorage !== 'undefined') {
            // Try to get token from localStorage
            savedToken = localStorage.getItem('supabase_auth_token') || localStorage.getItem('supabase_access_token');
            
            // If not in localStorage, try to get it from cookies
            if (!savedToken && typeof document !== 'undefined') {
                const cookieMatch = document.cookie.match(/supabase-auth-token=([^;]+)/);
                if (cookieMatch && cookieMatch[1]) {
                    savedToken = cookieMatch[1];
                    console.log('Found saved JWT token in cookies');
                }
            }
            
            if (savedToken) {
                console.log('Found saved JWT token');
                setToken(savedToken);
                
                // Verify the token and get user info
                try {
                    const { data: { user: currentUser }, error } = await supabase.auth.getUser(savedToken);
                    
                    if (error || !currentUser) {
                        console.error('Invalid stored JWT token:', error);
                        setToken(null);
                    } else {
                        // Valid token with user info
                        console.log('Valid stored JWT token - user authenticated');
                        user.set(currentUser);
                        
                        // Check admin status
                        if (currentUser) {
                            await checkAdminStatus(currentUser.id);
                        }
                    }
                } catch (err) {
                    console.error('Error validating stored JWT token:', err);
                    setToken(null);
                }
            }
        }
        
    } catch (error) {
        console.error('Error in initializeAuth:', error);
        user.set(null);
        setToken(null);
        isAdmin.set(false);
    } finally {
        isLoading.set(false);
    }
}

export const updateUser = (newUser: User | null) => {
	user.set(newUser);
};

export const signOut = async () => {
	// Clear JWT token (this also clears cookies via the setToken implementation)
	setToken(null);
	user.set(null);
	isAdmin.set(false);
	
	// Also sign out from Supabase
	try {
		await supabase.auth.signOut();
	} catch (error) {
		console.error('Error signing out from Supabase:', error);
	}
};

export const getUsername = (): string | null => {
	const currentUser = get(user);

	if (!currentUser) return null;

	if (currentUser.user_metadata?.username) {
		return currentUser.user_metadata.username;
	}

	if (currentUser.email) {
		return currentUser.email;
	}

	return currentUser.id || null;
};

/**
 * Logs the user out by:
 * - Clearing the user store
 * - Clearing admin status
 * - Clearing JWT token
 * - Signing out from Supabase
 */
export async function logout(): Promise<void> {
	// Reset the user store to null
	user.set(null);
	
	// Reset admin status
	isAdmin.set(false);
	adminCheckError.set(null);

	// Clear the JWT token
	setToken(null);
	
	// Sign out from Supabase
	try {
		await supabase.auth.signOut();
	} catch (error) {
		console.error('Error signing out from Supabase:', error);
	}
}

/**
 * Updates the user's username in Supabase and syncs the store
 */
export async function changeUsername(newUsername: string): Promise<void> {
	const { data, error } = await supabase.auth.updateUser({ data: { username: newUsername } });
	if (error) {
		console.error('Error changing username:', error);
		throw error;
	}
	user.set(data.user);
}

/**
 * Updates the user's password in Supabase and syncs the store
 */
export async function changePassword(newPassword: string): Promise<void> {
	const { data, error } = await supabase.auth.updateUser({ password: newPassword });
	if (error) {
		console.error('Error changing password:', error);
		throw error;
	}
	user.set(data.user);
}

/**
 * Updates the user's profile image URL in Supabase and syncs the store
 */
export async function changeUserImage(newImageUrl: string): Promise<void> {
	const { data, error } = await supabase.auth.updateUser({ data: { avatar_url: newImageUrl } });
	if (error) {
		console.error('Error changing user image:', error);
		throw error;
	}
	user.set(data.user);
}

// Using JWT authentication directly - no session subscriptions needed

/**
 * Checks if the specified user has admin privileges
 * @param userId The user ID to check
 */
export async function checkAdminStatus(userId: string): Promise<boolean> {
    if (!userId) {
        console.error('Invalid user ID provided to checkAdminStatus');
        isAdmin.set(false);
        adminCheckError.set('Invalid user ID');
        return false;
    }

    try {
        isAdminLoading.set(true);
        adminCheckError.set(null);
        
        const { data, error } = await supabase
            .from('user_roles')
            .select('is_admin')
            .eq('user_id', userId)
            .maybeSingle();
            
        if (error) {
            console.error('Error checking admin status:', error);
            adminCheckError.set(error.message);
            isAdmin.set(false);
            return false;
        }
        
        // If no role entry exists, user is not an admin
        if (!data) {
            isAdmin.set(false);
            return false;
        }
        
        const hasAdminRole = Boolean(data.is_admin);
        isAdmin.set(hasAdminRole);
        return hasAdminRole;
    } catch (error) {
        console.error('Error in admin status check:', error);
        adminCheckError.set(error instanceof Error ? error.message : 'Unknown error checking admin status');
        isAdmin.set(false);
        return false;
    } finally {
        isAdminLoading.set(false);
    }
}

/**
 * Gets the current admin status from the store
 * @returns Current admin status (true if user is admin)
 */
export function getAdminStatus(): boolean {
    return get(isAdmin);
}

/**
 * Checks if the current user logged in via OAuth provider
 */
export function isOAuthLogin(): boolean {
	const current = get(user);
	if (!current) return false;
	const providers: string[] = current.app_metadata?.providers ?? [];
	return providers.some(p => p !== 'email');
}
