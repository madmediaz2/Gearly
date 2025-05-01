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
            
            const cartItems = dbCart.map(item => ({
                id: item.id ,
                cart_id: item.cart_id,
                product_id: item.id,
                name: item.name || '',
                price: item.price || 0,
                quantity: item.quantity || 1,
                image_url: item.image_url || '',
                brand_name: item.brand_name || '',
                brand_image: item.brand_image || '',
                variant: item.variant,
                image: item.image_url || '',
                description: '',
                sku: '',
                stock: 0
            }));
            
            cart.set(cartItems);
        } catch (error) {
            console.log(error)
            if (!(error instanceof Error && 
                (error.message.includes('not found') || 
                 error.message.includes('does not exist')))
            ) {
                cartError.set(null); 
            } else {
                cartError.set(error.message)
            }
        } finally {
            isCartLoading.set(false);
        }
    }
});

// Helper functions to manage the cart
export async function addToCart(item: Omit<ProductItem, 'quantity'>, quantity: number = 1) {
    const currentUser = get(user);
    
    cartError.set(null);
    
    cart.update(items => {
        const existingItemIndex = items.findIndex(i => i.id === item.id);
        if (existingItemIndex > -1) {
            items[existingItemIndex].quantity += quantity;
        } else {
            items.push({ ...item, quantity });
        }
        return items;
    });
    
    if (currentUser) {
        try {
            await addItemToCart(
                currentUser.id,
                item.id,
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
    
    cartError.set(null);
    
    cart.update(items => items.filter(item => item.id !== itemId));
    
    if (currentUser) {
        try {
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
    
    cartError.set(null);
    
    cart.update(items => {
        const itemIndex = items.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
            if (newQuantity <= 0) {
                items.splice(itemIndex, 1);
            } else {
                items[itemIndex].quantity = newQuantity;
            }
        }
        return items;
    });
    
    if (currentUser) {
        try {
            await addItemToCart(
                currentUser.id,
                itemId,
                newQuantity
            );
        } catch (error) {
            if (newQuantity > 0) {
                console.error('Error updating quantity in database:', error);
                cartError.set('Failed to update item quantity');
            }
        }
    }
}

export async function clearCart() {
    const currentUser = get(user);
    
    cartError.set(null);
    
    cart.set([]);
    
    if (currentUser) {
        try {
            const items = get(cart);
            for (const item of items) {
                await addItemToCart(
                    currentUser.id,
                    item.id,
                    0
                );
            }
        } catch (error) {
            console.error('Error clearing cart in database:', error);
            cartError.set('Failed to clear your cart');
        }
    }
}
