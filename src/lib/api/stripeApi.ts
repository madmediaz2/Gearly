import { loadStripe } from '@stripe/stripe-js';
import type { ProductItem } from '$lib/types/supabaseTypes';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * Creates a checkout session for the cart items
 * @param cartItems Items in the shopping cart
 * @returns The Stripe checkout session ID
 */
export async function createCheckoutSession(cartItems: ProductItem[]): Promise<string> {
    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cartItems: cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image_url || item.image
                }))
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }

        const { sessionId } = await response.json();
        return sessionId;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
}

/**
 * Redirects to Stripe checkout
 * @param sessionId The Stripe checkout session ID
 */
export async function redirectToCheckout(sessionId: string): Promise<void> {
    try {
        const stripe = await stripePromise;
        if (!stripe) {
            throw new Error('Failed to load Stripe');
        }

        const { error } = await stripe.redirectToCheckout({
            sessionId,
        });

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error redirecting to checkout:', error);
        throw error;
    }
}
