import { supabase } from '../supabaseClient';
import type { Brand, ProductWithImages, ProductItem } from '../types/supabaseTypes';

/**
 * Fetches all shop items with their images and details including brand information
 * @returns Promise with product data including images and brand info
 */
export async function fetchShopItems(): Promise<ProductItem[]> {
	// First get all active products with their images
	const { data: products, error: productsError } = await supabase
		.from('products')
		.select(`
      *,
      product_images (*)
    `)
		.eq('is_active', true)
		.order('created_at', { ascending: false });

	if (productsError) throw productsError;
	if (!products || products.length === 0) return [];

	// Get all brand IDs from the products
	const brandIds = products
		.map(p => p.brand_id)
		.filter((id): id is number => id !== null);

	// If we have brand IDs, fetch the brands
	let brands: Record<number, Brand> = {};
	if (brandIds.length > 0) {
		const { data: brandsData, error: brandsError } = await supabase
			.from('brands')
			.select('*')
			.in('id', brandIds);

		if (brandsError) throw brandsError;

		// Create a lookup map for brands by ID
		brands = (brandsData || []).reduce((acc, brand) => {
			acc[brand.id] = brand;
			return acc;
		}, {} as Record<number, Brand>);
	}

	// Format data to match ProductItem structure
	return (products as ProductWithImages[]).map(product => {
		const brand = product.brand_id ? brands[product.brand_id] : null;

		return {
			id: product.id,
			name: product.name,
			price: product.price,
			quantity: 1, // Default quantity for display
			image: product.product_images?.[0]?.url || '',
			brand_name: brand?.name || null,
			brand_image: brand?.image_url ?? null,
			image_url: product.product_images?.[0]?.url || null,
			description: product.description || '',
			sku: product.sku || '',
			stock: product.stock,
			product_id: product.id,
			variant: null
		};
	});
}

/**
 * Gets the current user's cart items from the view
 * @param userId The authenticated user's ID
 * @returns Promise with cart items
 */
export async function fetchCartItems(userId: string): Promise<ProductItem[]> {
	// First get the user's cart
	const { data: cartData, error: cartError } = await supabase
		.from('carts')
		.select('id')
		.eq('user_id', userId)
		.single();

	if (cartError && cartError.code !== 'PGRST116') {
		// Not found is okay (we'll create it later)
		throw cartError;
	}

	if (!cartData) {
		// Cart doesn't exist yet
		return [];
	}

	// Then get the cart items using the cart_item_view
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
	// First ensure the user has a cart
	let cartId: string;

	const { data: cartData, error: cartError } = await supabase
		.from('carts')
		.select('id')
		.eq('user_id', userId)
		.single();

	if (cartError && cartError.code === 'PGRST116') {
		// Cart not found, create one
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

	// Now add the item to the cart
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
