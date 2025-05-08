import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import { supabase } from '$lib/supabaseClient';
import { createOrder, addOrderItems } from '$lib/api/orderApi';
import { getCheckoutSessionItems, updateCheckoutSessionStatus, updateProductStock } from '$lib/api/checkoutApi';

const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY);

export async function GET({ url }) {
    try {
        const sessionId = url.searchParams.get('session_id');
        if (!sessionId) {
            return json({ success: false, message: 'Session ID is required' }, { status: 400 });
        }
        
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session.payment_status !== 'paid') {
            return json({ 
                success: false, 
                message: 'Payment not completed',
                status: session.payment_status
            }, { status: 400 });
        }
        
        
        const userId = session.metadata?.userId;
        let purchasedItems: Array<{ id: number, quantity: number }> = [];
        
        try {
            purchasedItems = await getCheckoutSessionItems(sessionId);
            await updateCheckoutSessionStatus(sessionId, 'completed');
            
            
            if (userId && userId !== 'guest') {
                
                const order = await createOrder(
                    userId, 
                    sessionId, 
                    session.amount_total ? session.amount_total / 100 : 0,
                    'completed',
                    session.payment_status
                );
                
                if (order && purchasedItems.length > 0) {
                    await addOrderItems(order.id, purchasedItems);
                }
                
                
                const { data: cartData } = await supabase
                    .from('carts')
                    .select('id')
                    .eq('user_id', userId)
                    .single();
                
                if (cartData?.id) {
                    await supabase
                        .from('cart_items')
                        .delete()
                        .eq('cart_id', cartData.id);
                }
            }
            
            
            if (purchasedItems.length > 0) {
                await updateProductStock(purchasedItems);
            }
        } catch (error) {
            
            return json({ 
                success: false, 
                message: error instanceof Error ? error.message : 'Error processing payment',
                sessionId
            }, { status: 500 });
        }
        
        return json({
            success: true,
            message: 'Payment processed successfully',
            sessionId,
            itemsProcessed: purchasedItems.length,
            purchasedItems
        });
    } catch (error) {
        return json({ 
            success: false, 
            message: error instanceof Error ? error.message : 'Unknown error verifying payment'
        }, { status: 500 });
    }
}
