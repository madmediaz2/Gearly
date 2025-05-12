import { writable, get } from 'svelte/store';
import { user } from './authStore';
import { browser } from '$app/environment';
import { addItemToCart, fetchCartItems, clearCart as clearCartDB } from '$lib/api/supabaseApi';
import { createCheckoutSession, redirectToCheckout } from '$lib/api/stripeApi';
import type { ProductItem } from '$lib/types/supabaseTypes';


export const cart = writable<ProductItem[]>([]);
export const isCartLoading = writable(false);
export const cartError = writable<string | null>(null);
export const isCheckoutLoading = writable(false);
export const checkoutError = writable<string | null>(null);

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
            console.error(error)
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
    
    // Clear cart in store
    cart.set([]);
    
    if (currentUser) {
        try {
            await clearCartDB(currentUser.id);
        } catch (error) {
            console.error('Error clearing cart in database:', error);
            cartError.set('Failed to clear your cart');
        }
    } else {
        console.log('No logged in user, skipping database cart clearing');
    }
}

/**
 * Updates the quantity of an item in the cart ONLY if it already exists.
 * Returns true if the item was found and updated, false otherwise.
 */
export async function updateQuantityIfInCart(itemId: number, quantity: number): Promise<boolean> {
    const currentUser = get(user);
    let itemFound = false;
    
    cart.update(items => {
        const existingItemIndex = items.findIndex(i => i.id === itemId);
        if (existingItemIndex > -1) {
            items[existingItemIndex].quantity = quantity;
            itemFound = true;
        }
        return items;
    });
    
    if (itemFound && currentUser) {
        try {
            // Use await to ensure the promise is handled properly
            await addItemToCart(
                currentUser.id,
                itemId,
                quantity
            );
        } catch (error) {
            console.error('Error updating quantity in database:', error);
            cartError.set('Failed to update item quantity');
        }
    }
    
    return itemFound;
}

/**
 * Returns the quantity of a specific item in the cart.
 * If the item is not in the cart, returns 0.
 */
export function getItemQuantity(itemId: ProductItem['id']): number {
    const items: ProductItem[] = get(cart);
    const existingItem = items.find(item => item.id === itemId);
    return existingItem ? existingItem.quantity : 0;
}

/**
 * Process checkout for the items in the cart with Stripe
 * Redirects the user to Stripe's checkout page
 */
export async function processCheckout(): Promise<void> {
    const items = get(cart);
    
    if (items.length === 0) {
        cartError.set('Your cart is empty');
        return;
    }
    
    try {
        isCheckoutLoading.set(true);
        checkoutError.set(null);
        
        // Create a checkout session
        const sessionId = await createCheckoutSession(items);
        
        // Redirect to Stripe checkout
        await redirectToCheckout(sessionId);
        
    } catch (error) {
        console.error('Error during checkout:', error);
        checkoutError.set(error instanceof Error ? error.message : 'An error occurred during checkout');
    } finally {
        isCheckoutLoading.set(false);
    }
}
