import { writable } from 'svelte/store';

export interface CartItem {
    id: number; 
    name: string;
    price: number;
    quantity: number;
    image: string;
    brand: string;
    brandImage: string;
    variant?: string;
}

// Initialize the store with an empty array
export const cart = writable<CartItem[]>([]);

// Optional: Helper functions to manage the cart
export function addToCart(item: Omit<CartItem, 'quantity'>, quantity: number = 1) {
    cart.update(items => {
        const existingItemIndex = items.findIndex(i => i.id === item.id);
        if (existingItemIndex > -1) {
            // Item exists, update quantity
            items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            items.push({ ...item, quantity });
        }
        return items; // Return the updated array
    });
}

export function removeFromCart(itemId: number) {
    cart.update(items => items.filter(item => item.id !== itemId));
}

export function updateQuantity(itemId: number, newQuantity: number) {
    cart.update(items => {
        const itemIndex = items.findIndex(i => i.id === itemId);
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
}
