import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { supabase } from '$lib/supabaseClient';
import type { ProductItem } from '$lib/types/supabaseTypes.js';
import { storeCheckoutSession } from '$lib/api/checkoutApi';

const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY);

export async function POST({ request }) {
    try {
        const { cartItems } = await request.json();
        
        const session = await supabase.auth.getSession();
        const user = session?.data?.session?.user || null;
        
        const lineItems = cartItems.map((item: ProductItem) => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.name,
                    images: item.image ? [item.image] : [],
                },
                unit_amount: Math.round(item.price * 100), // Stripe uses cents
            },
            quantity: item.quantity,
        }));
        
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get('origin')}/cart`,
            metadata: {
                userId: user?.id || 'guest'
            }
        });

        await storeCheckoutSession(
            checkoutSession.id,
            user?.id || 'guest',
            cartItems
        );
        
        return json({ sessionId: checkoutSession.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return json({ 
            error: 'Failed to create checkout session',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
