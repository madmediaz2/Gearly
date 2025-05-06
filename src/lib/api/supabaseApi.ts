import { supabase } from '../supabaseClient';
import type { Brand, ProductWithImages, ProductItem } from '../types/supabaseTypes';

/**
 * Fetches all shop items with their images and details including brand information
 * @returns Promise with product data including images and brand info
 */
export async function fetchShopItems(): Promise<ProductItem[]> {
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

	const brandIds = products
		.map(p => p.brand_id)
		.filter((id): id is number => id !== null);

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
			variant: null,
		};
	});
}

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

	// Delete all items from the cart
	const { error: deleteError } = await supabase
		.from('cart_items')
		.delete()
		.eq('cart_id', cartData.id);

	if (deleteError) throw deleteError;

	return { success: true };
}

/**
 * Fetches a single product by ID with images and brand information
 * @param productId The ID of the product to fetch
 * @returns Promise with product data including images and brand info
 */
export async function fetchProductById(productId: number | string): Promise<ProductItem | null> {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      *,
      product_images (*)
    `)
    .eq('id', productId)
    .eq('is_active', true)
    .single();

  if (productError) {
    if (productError.code === 'PGRST116') {  // Code for "no rows returned"
      return null;
    }
    throw productError;
  }
  
  if (!product) return null;

  // Fetch brand information if the product has a brand_id
  let brand: Brand | null = null;
  if (product.brand_id) {
    const { data: brandData, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', product.brand_id)
      .single();
    
    if (brandError && brandError.code !== 'PGRST116') throw brandError;
    if (brandData) brand = brandData;
  }

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1, 
    image: product.product_images?.[0]?.url || '',
    brand_name: brand?.name || null,
    brand_image: brand?.image_url ?? null,
    image_url: product.product_images?.[0]?.url || null, 
    description: product.description || '',
    sku: product.sku || '',
    stock: product.stock,
    variant: null,
    product_images: product.product_images || []
  };
}
