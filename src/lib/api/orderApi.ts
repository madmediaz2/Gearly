import { supabase } from '../supabaseClient';

/**
 * Creates a new order in the database
 * @param userId User ID who placed the order
 * @param sessionId Stripe session ID
 * @param amount Total order amount
 * @param status Order status
 * @param paymentStatus Payment status
 * @returns Order ID and status
 */
export async function createOrder(
    userId: string,
    sessionId: string,
    amount: number,
    status: string = 'completed',
    paymentStatus: string = 'paid'
) {
    // Create the order record
    const { data: order, error } = await supabase
        .from('orders')
        .insert({
            user_id: userId,
            stripe_session_id: sessionId,
            amount_total: amount,
            status,
            payment_status: paymentStatus,
            created_at: new Date().toISOString()
        })
        .select('id')
        .single();

    if (error) throw error;
    
    return order;
}

/**
 * Add items to an existing order
 * @param orderId The ID of the order to add items to
 * @param items Array of items (product ID and quantity)
 */
export async function addOrderItems(orderId: number, items: Array<{id: number, quantity: number}>) {
    const orderItems = items.map(item => ({
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity
    }));
    
    const { error } = await supabase
        .from('order_items')
        .insert(orderItems);
        
    if (error) throw error;
    
    return { success: true };
}
