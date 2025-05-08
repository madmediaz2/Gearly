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
      product_images (*),
      product_specifications (
        specification_attribute_id,
        value,
        specification_attributes:specification_attribute_id (*)
      )
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
		
		// Process specifications if available
		const specifications = [];
		
		if (product.product_specifications && Array.isArray(product.product_specifications)) {
			for (const spec of product.product_specifications) {
				if (spec.specification_attributes && spec.value) {
					specifications.push({
						attribute: spec.specification_attributes,
						value: spec.value
					});
				}
			}
		}

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
			specifications: specifications.length > 0 ? specifications : undefined,
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
      product_images (*),
      product_specifications (
        specification_attribute_id,
        value,
        specification_attributes:specification_attribute_id (*)
      )
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

	// Fetch category information for this product
	let category: string | null = null;
	const { data: categoryData, error: categoryError } = await supabase
		.from('product_categories')
		.select(`
			categories:category_id (
				name
			)
		`)
		.eq('product_id', product.id)
		.limit(1);
		
	if (!categoryError && categoryData && categoryData.length > 0) {
		const categoryObj = categoryData[0]?.categories;
		if (categoryObj && typeof categoryObj === 'object' && 'name' in categoryObj) {
			category = categoryObj.name as string;
		}
	} else if (categoryError && categoryError.code !== 'PGRST116') {
		console.error('Error fetching product category:', categoryError);
	}

	// Process specifications if available
	const specifications = [];

	if (product.product_specifications && Array.isArray(product.product_specifications)) {
		for (const spec of product.product_specifications) {
			// Only add specifications that have attributes and values
			if (spec.specification_attributes && spec.value) {
				specifications.push({
					attribute: spec.specification_attributes,
					value: spec.value
				});
			}
		}
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
		category: category || undefined,
		product_images: product.product_images || [],
		specifications: specifications.length > 0 ? specifications : undefined
	};
}

/**
 * Creates a new product
 * @param productData The product data to create
 * @returns Promise with the created product
 */
export async function createProduct(productData: Partial<ProductWithImages>) {
	const { data, error } = await supabase
		.from('products')
		.insert([{
			name: productData.name,
			price: productData.price || 0,
			description: productData.description || '',
			sku: productData.sku || '',
			stock: productData.stock || 0,
			is_active: true,
			brand_id: productData.brand_id
		}])
		.select('id')
		.single();

	if (error) throw error;
	return data;
}

/**
 * Updates an existing product
 * @param id The ID of the product to update
 * @param productData The updated product data
 * @returns Promise with the updated product
 */
export async function updateProduct(id: number, productData: Partial<ProductWithImages>) {
	const { data, error } = await supabase
		.from('products')
		.update({
			name: productData.name,
			price: productData.price,
			description: productData.description,
			sku: productData.sku,
			stock: productData.stock,
			brand_id: productData.brand_id
		})
		.eq('id', id)
		.select('id')
		.single();

	if (error) throw error;
	return data;
}

/**
 * Marks a product as inactive (soft delete)
 * @param id The ID of the product to delete
 * @returns Promise with operation result
 */
export async function deleteProduct(id: number) {
	const { error } = await supabase
		.from('products')
		.update({ is_active: false })
		.eq('id', id);

	if (error) throw error;
	return { success: true };
}

/**
 * Creates a product image entry in the database
 * @param productId The product ID to associate with the image
 * @param imageUrl The URL of the uploaded image
 * @param altText Optional alt text for the image
 * @param position Optional position for image ordering
 * @returns Promise with the created image data
 */
export async function createProductImage(
	productId: number,
	imageUrl: string,
	altText?: string,
	position: number = 0
) {
	const { data, error } = await supabase
		.from('product_images')
		.insert([{
			product_id: productId,
			url: imageUrl,
			alt_text: altText || null,
			position
		}])
		.select('id')
		.single();

	if (error) throw error;
	return data;
}

/**
 * Deletes a product image
 * @param imageId The ID of the image to delete
 * @returns Promise with operation result
 */
export async function deleteProductImage(imageId: number) {
	const { error } = await supabase
		.from('product_images')
		.delete()
		.eq('id', imageId);

	if (error) throw error;
	return { success: true };
}

/**
 * Fetches all brands
 * @returns Promise with brand data
 */
export async function fetchBrands() {
	const { data, error } = await supabase
		.from('brands')
		.select('id, name, image_url')
		.order('name');

	if (error) throw error;
	return data || [];
}

/**
 * Creates a new brand and optionally uploads an image for it
 * @param name The name of the brand to create
 * @param imageFile Optional image file to upload for the brand
 * @returns Promise with the created brand data including ID
 */
export async function createBrand(name: string, imageFile?: File) {
	// Create the brand in the database
	const { data: brandData, error: brandError } = await supabase
		.from("brands")
		.insert([{ name: name.trim() }])
		.select("id")
		.single();

	if (brandError) throw brandError;

	// Upload the brand image if one was provided
	if (imageFile && brandData?.id) {
		const fileExt = imageFile.name.split(".").pop();
		const fileName = `brand_${brandData.id}_${Date.now()}.${fileExt}`;
		const filePath = `brand-images/${fileName}`;

		const { error: uploadError } = await supabase.storage
			.from("brands")
			.upload(filePath, imageFile);

		if (uploadError) {
			console.error("Error uploading image:", uploadError);
			throw new Error("Failed to upload brand image");
		}

		const { data: publicUrl } = supabase.storage
			.from("brands")
			.getPublicUrl(filePath);

		if (publicUrl) {
			// Update the brand with the image URL
			const { error: updateError } = await supabase
				.from("brands")
				.update({ image_url: publicUrl.publicUrl })
				.eq("id", brandData.id);

			if (updateError) {
				console.error(
					"Error updating brand with image:",
					updateError,
				);
			}
		}
	}

	return brandData;
}

/**
 * Deletes a brand by ID
 * @param brandId The ID of the brand to delete
 * @returns Promise with operation result
 */
export async function deleteBrand(brandId: number) {
	const { error } = await supabase
		.from("brands")
		.delete()
		.eq("id", brandId);

	if (error) throw error;
	return { success: true };
}

/**
 * Creates a new category
 * @param name The name of the category to create
 * @param slug Optional slug for the category (will be generated from name if not provided)
 * @returns Promise with operation result
 */
export async function createCategory(name: string, slug?: string) {
	// Generate slug if not provided
	const categorySlug = slug?.trim() || name.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
		
	// Create the category in the database
	const { data, error } = await supabase
		.from('categories')
		.insert([{ 
			name: name.trim(),
			slug: categorySlug
		}])
		.select('id')
		.single();
		
	if (error) throw error;
	return data;
}

/**
 * Deletes a category by ID
 * @param categoryId The ID of the category to delete
 * @returns Promise with operation result
 */
export async function deleteCategory(categoryId: number): Promise<{ success: boolean }> {
	// Delete from product_categories first (junction table)
	const { error: junctionError } = await supabase
		.from('product_categories')
		.delete()
		.eq('category_id', categoryId);
		
	if (junctionError) throw junctionError;
	
	// Then delete the category itself
	const { error: deleteError } = await supabase
		.from('categories')
		.delete()
		.eq('id', categoryId);
		
	if (deleteError) throw deleteError;
	
	return { success: true };
}
