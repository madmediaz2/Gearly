import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export async function GET({ url }) {
    try {
        const productIds = url.searchParams.get('productIds');
        
        if (!productIds) {
            return json({ success: false, message: 'No product IDs provided' }, { status: 400 });
        }
        
        const idArray = productIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        
        if (idArray.length === 0) {
            return json({ success: false, message: 'Invalid product IDs format' }, { status: 400 });
        }
        
        console.log(`Fetching updated stock levels for products: ${idArray.join(', ')}`);
        
        const { data: products, error } = await supabase
            .from('products')
            .select('id, stock, price')
            .in('id', idArray);
            
        if (error) {
            console.error('Error fetching product stock levels:', error);
            return json({ 
                success: false, 
                message: `Database error: ${error.message}` 
            }, { status: 500 });
        }
        
        if (!products || products.length === 0) {
            return json({ 
                success: false, 
                message: 'No products found with the specified IDs' 
            }, { status: 404 });
        }
        
        return json({
            success: true,
            products: products.map(product => ({
                id: product.id,
                stock: product.stock,
                price: product.price
            }))
        });
        
    } catch (error) {
        console.error('Error in update-stock-cache endpoint:', error);
        return json({ 
            success: false, 
            message: error instanceof Error ? error.message : 'Unknown error updating stock cache'
        }, { status: 500 });
    }
}
