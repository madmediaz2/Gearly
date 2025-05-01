import { writable, get } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { browser } from '$app/environment';

export const user = writable<User | null>(null);
export const isLoading = writable<boolean>(true);

export async function initializeAuth() {
	try {
		const { data } = await supabase.auth.getSession();
		user.set(data.session?.user ?? null);
	} catch (error) {
		console.error('Error checking authentication:', error);
	} finally {
		isLoading.set(false);
	}
}

export const updateUser = (newUser: User | null) => {
	user.set(newUser);
};

export const signOut = async () => {
	await supabase.auth.signOut();
	user.set(null);
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
 * - Removing the auth token from localStorage
 * - Removing any other user-related data
 */
export async function logout(): Promise<void> {
	// Reset the user store to null
	user.set(null);

	await supabase.auth.signOut()

	// If using localStorage/sessionStorage for token storage, clear it
	if (browser) {
		localStorage.removeItem('authToken');
		sessionStorage.removeItem('authToken');
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

// Subscribe to auth state changes
if (typeof window !== 'undefined') {
	supabase.auth.onAuthStateChange((event, session) => {
		user.set(session?.user ?? null);
	});
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
