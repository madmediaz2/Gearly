import { supabase } from '../supabaseClient';
import type { ProductItem } from '../types/supabaseTypes';

/**
 * Gets the current user's cart items from the view
 * @param userId The authenticated user's ID
 * @returns Promise with cart items
 */
export async function fetchCartItems(userId: string): Promise<ProductItem[]> {
	const { data: cartData, error: cartError } = await supabase
		.from('carts')
		.select('id')
		.eq('user_id', userId)
		.single();

	if (cartError && cartError.code !== 'PGRST116') {
		throw cartError;
	}

	if (!cartData) {
		return [];
	}

	const { data, error } = await supabase
		.from('cart_item_view')
		.select('*')
		.eq('cart_id', cartData.id);

	if (error) throw error;

	return data || [];
}

/**
 * Adds an item to the user's cart
 * @param userId The authenticated user's ID
 * @param productId The product ID to add
 * @param quantity The quantity to add (default: 1)
 * @param variant Optional variant information
 */
export async function addItemToCart(
	userId: string,
	productId: number,
	quantity: number = 1,
	variant?: string
) {
	let cartId: string;

	const { data: cartData, error: cartError } = await supabase
		.from('carts')
		.select('id')
		.eq('user_id', userId)
		.single();

	if (cartError && cartError.code === 'PGRST116') {
		const { data: newCart, error: createError } = await supabase
			.from('carts')
			.insert([{ user_id: userId }])
			.select('id')
			.single();

		if (createError) throw createError;
		cartId = newCart.id;
	} else if (cartError) {
		throw cartError;
	} else {
		cartId = cartData.id;
	}

	const { error: addError } = await supabase
		.from('cart_items')
		.upsert([
			{
				cart_id: cartId,
				product_id: productId,
				quantity,
				variant,
				updated_at: new Date().toISOString()
			}
		], {
			onConflict: 'cart_id,product_id,variant',
			ignoreDuplicates: false
		});

	if (addError) throw addError;

	return { success: true };
}

/**
 * Clears all items from the user's cart
 * @param userId The authenticated user's ID
 * @returns Promise with operation result
 */
export async function clearCart(userId: string) {
	const { data: cartData, error: cartError } = await supabase
		.from('carts')
		.select('id')
		.eq('user_id', userId)
		.single();

	if (cartError && cartError.code === 'PGRST116') {
		return { success: true };
	} else if (cartError) {
		throw cartError;
	}

	const { error: deleteError } = await supabase
		.from('cart_items')
		.delete()
		.eq('cart_id', cartData.id);

	if (deleteError) throw deleteError;

	return { success: true };
}
