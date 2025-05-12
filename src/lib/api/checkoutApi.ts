import { supabase } from '../supabaseClient';
import type { ProductItem } from '../types/supabaseTypes';

export async function storeCheckoutSession(
    sessionId: string,
    userId: string,
    cartItems: ProductItem[]
): Promise<void> {
    try {
        
        const { error: sessionError } = await supabase
            .from('checkout_sessions')
            .insert([{
                session_id: sessionId,
                user_id: userId,
                status: 'pending',
                created_at: new Date().toISOString()
            }]);

        if (sessionError) {
            console.error(`Error inserting checkout session: ${sessionError.message}`);
            throw sessionError;
        }

        const checkoutItems = cartItems.map(item => {
            if (!item.id) {
                console.warn(`Item missing ID: ${JSON.stringify(item)}`);
            }
            if (!item.quantity || item.quantity <= 0) {
                console.warn(`Item has invalid quantity: ${JSON.stringify(item)}`);
            }
            
            return {
                session_id: sessionId,
                product_id: item.id,
                quantity: item.quantity || 1,
                price: item.price || 0
            };
        });

        
        const { error: itemsError } = await supabase
            .from('checkout_items')
            .insert(checkoutItems);

        if (itemsError) {
            console.error(`Error inserting checkout items: ${itemsError.message}`);
            throw itemsError;
        }

    } catch (error) {
        console.error('Error storing checkout session:', error);
        throw error;
    }
}

/**
 * Fetches items from a checkout session
 * @param sessionId The Stripe checkout session ID
 * @returns Promise with array of ordered items (product ID and quantity)
 */
export async function getCheckoutSessionItems(
    sessionId: string
): Promise<Array<{ id: number, quantity: number }>> {
    try {
        
        const { data, error } = await supabase
            .from('checkout_items')
            .select('product_id, quantity')
            .eq('session_id', sessionId);

        if (error) {
            console.error(`Database error retrieving checkout items: ${error.message}`);
            throw error;
        }

        if (!data || data.length === 0) {
            return [];
        }

        const mappedItems = data.map(item => ({
            id: Number(item.product_id),
            quantity: Number(item.quantity)
        }));
        
        return mappedItems;
    } catch (error) {
        console.error('Error fetching checkout items:', error);
        throw error;
    }
}

/**
 * Updates a checkout session status
 * @param sessionId The Stripe checkout session ID
 * @param status The new status ('completed', 'cancelled', etc.)
 */
export async function updateCheckoutSessionStatus(
    sessionId: string,
    status: string
): Promise<void> {
    try {
        const { error } = await supabase
            .from('checkout_sessions')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('session_id', sessionId);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating checkout session status:', error);
        throw error;
    }
}

/**
 * Decreases product stock levels after a successful checkout
 * @param purchasedItems Array of items with product ID and quantity
 * @returns Promise with results of the stock updates
 */
export async function updateProductStock(
    purchasedItems: Array<{ id: number, quantity: number }>
): Promise<Array<{ id: number, success: boolean, message?: string }>> {
    if (!purchasedItems || purchasedItems.length === 0) return [];
    
    const results: Array<{ id: number, success: boolean, message?: string }> = [];
    
    for (const item of purchasedItems) {
        try {
            const { data: product, error: selectError } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.id)
                .single();
            
            if (selectError) {
                console.error(`Error fetching product ${item.id}:`, selectError);
                results.push({
                    id: item.id, 
                    success: false, 
                    message: `Database error: ${selectError.message}`
                });
                continue;
            }
            
            if (!product) {
                console.error(`Product not found for ID ${item.id}`);
                results.push({
                    id: item.id, 
                    success: false, 
                    message: 'Product not found'
                });
                continue;
            }
            
            
            const newStock = Math.max(0, product.stock - item.quantity);
            
            const { error: updateError } = await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', item.id);
                
            if (updateError) {
                console.error(`Error updating stock for product ${item.id}:`, updateError);
                results.push({
                    id: item.id, 
                    success: false, 
                    message: `Update error: ${updateError.message}`
                });
            } else {
                results.push({
                    id: item.id, 
                    success: true, 
                    message: `Stock updated from ${product.stock} to ${newStock}`
                });
            }
        } catch (error) {
            console.error(`Error processing stock update for item ${item.id}:`, error);
            results.push({
                id: item.id, 
                success: false, 
                message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    }
    
    return results;
}
