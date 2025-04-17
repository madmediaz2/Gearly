import { writable, get } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { browser } from '$app/environment';

// Create a writable store for the user
export const user = writable<User | null>(null);

// Create a store for loading state
export const isLoading = writable<boolean>(true);

// Initialize the store by checking for an existing session
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

// Update user in the store
export const updateUser = (newUser: User | null) => {
  user.set(newUser);
};

// Sign out the user
export const signOut = async () => {
  await supabase.auth.signOut();
  user.set(null);
};

// Get the username of the current user
export const getUsername = (): string | null => {
  const currentUser = get(user);
  
  if (!currentUser) return null;
  
  // Try to get username from user_metadata if it exists
  if (currentUser.user_metadata?.username) {
    return currentUser.user_metadata.username;
  }
  
  // Fall back to email
  if (currentUser.email) {
    return currentUser.email;
  }
  
  // Last resort: use user ID
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
  
  // If you have any other user data stored, clear it here
  // For example: shoppingCart.reset(), userPreferences.reset(), etc.
  
  // You can add a notification or redirect as needed
  // goto('/'); // If using SvelteKit's goto for navigation
}

// Subscribe to auth state changes
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    user.set(session?.user ?? null);
  });
}
