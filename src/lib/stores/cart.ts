import { writable, get } from 'svelte/store';
import { user } from './authStore';
import { browser } from '$app/environment';
import { addItemToCart, fetchCartItems } from '$lib/supabaseClient';
import type { ProductItem } from '$lib/types/supabaseTypes';


// Initialize the store with an empty array
export const cart = writable<ProductItem[]>([]);
export const isCartLoading = writable(false);
export const cartError = writable<string | null>(null);

// Load cart from localStorage on client-side initialization
if (browser) {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        try {
            cart.set(JSON.parse(savedCart));
        } catch (e) {
            console.error('Failed to parse saved cart:', e);
        }
    }
    
    // Subscribe to cart changes to save to localStorage for non-logged in users
    cart.subscribe(items => {
        localStorage.setItem('cart', JSON.stringify(items));
    });
}

// Initialize cart from database when user logs in
user.subscribe(async (currentUser) => {
    if (browser && currentUser) {
        try {
            isCartLoading.set(true);
            cartError.set(null);
            const dbCart = await fetchCartItems(currentUser.id);
            
            // Transform database items to match ProductItem interface
            const cartItems = dbCart.map(item => ({
                id: item.id || item.product_id, // Use id from database or fallback to product_id
                cart_id: item.cart_id,
                product_id: item.product_id,
                name: item.name || '',
                price: item.price || 0,
                quantity: item.quantity || 1,
                image_url: item.image_url || '',
                brand_name: item.brand_name || '',
                brand_image: item.brand_image || '',
                variant: item.variant,
                // Add required ProductItem properties
                image: item.image_url || '',
                description: '',
                sku: '',
                stock: 0
            }));
            
            cart.set(cartItems);
        } catch (error) {
            console.error('Error loading cart from database:', error);
            cartError.set('Failed to load your cart from the database');
        } finally {
            isCartLoading.set(false);
        }
    }
});

// Helper functions to manage the cart
export async function addToCart(item: Omit<ProductItem, 'quantity'>, quantity: number = 1) {
    const currentUser = get(user);
    
    // Clear any previous errors
    cartError.set(null);
    
    // Update local cart state immediately for responsive UI
    cart.update(items => {
        const existingItemIndex = items.findIndex(i => i.product_id === item.product_id);
        if (existingItemIndex > -1) {
            // Item exists, update quantity
            items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            items.push({ ...item, quantity });
        }
        return items;
    });
    
    // If user is logged in, sync with database
    if (currentUser) {
        try {
            await addItemToCart(
                currentUser.id,
                item.product_id,
                quantity,
                item.variant as string
            );
        } catch (error) {
            console.error('Error saving cart to database:', error);
            cartError.set('Failed to save your cart to the database');
        }
    }
}

export async function removeFromCart(itemId: number) {
    const currentUser = get(user);
    
    // Clear any previous errors
    cartError.set(null);
    
    // Update local cart state immediately
    cart.update(items => items.filter(item => item.product_id !== itemId));
    
    // If user is logged in, sync with database
    if (currentUser) {
        try {
            // Using 0 quantity as a way to remove the item
            await addItemToCart(
                currentUser.id,
                itemId,
                0
            );
        } catch (error) {
            console.error('Error removing item from database:', error);
            cartError.set('Failed to remove item from your cart');
        }
    }
}

export async function updateQuantity(itemId: number, newQuantity: number) {
    const currentUser = get(user);
    
    // Clear any previous errors
    cartError.set(null);
    
    // Update local cart state immediately
    cart.update(items => {
        const itemIndex = items.findIndex(i => i.product_id === itemId);
        if (itemIndex > -1) {
            if (newQuantity <= 0) {
                // Remove item if quantity is zero or less
                items.splice(itemIndex, 1);
            } else {
                items[itemIndex].quantity = newQuantity;
            }
        }
        return items;
    });
    
    // If user is logged in, sync with database
    if (currentUser) {
        try {
            await addItemToCart(
                currentUser.id,
                itemId,
                newQuantity
            );
        } catch (error) {
            console.error('Error updating quantity in database:', error);
            cartError.set('Failed to update item quantity');
        }
    }
}

export async function clearCart() {
    const currentUser = get(user);
    
    // Clear any previous errors
    cartError.set(null);
    
    // Clear local cart state
    cart.set([]);
    
    // If user is logged in, clear in database
    if (currentUser) {
        try {
            // This requires a new backend function, but for now we'll handle it client-side
            // by removing each item one by one
            const items = get(cart);
            for (const item of items) {
                await addItemToCart(
                    currentUser.id,
                    item.product_id,
                    0
                );
            }
        } catch (error) {
            console.error('Error clearing cart in database:', error);
            cartError.set('Failed to clear your cart');
        }
    }
}
