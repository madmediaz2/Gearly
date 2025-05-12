import { supabase, supabaseAdmin } from '../supabaseClient';
import type { ProductItem, Brand } from '../types/supabaseTypes';

/**
 * Saves a product (creates new or updates existing)
 * @param product The product data to save
 * @param isNew Whether the product is new (true) or existing (false)
 * @param brandId The ID of the brand for the product
 * @returns Promise with the saved product ID
 */
export async function saveProduct(
	product: ProductItem,
	isNew: boolean,
	brandId: number | null
): Promise<{ id: number }> {
	const productData = {
		name: product.name,
		price: product.price,
		description: product.description,
		sku: product.sku,
		stock: product.stock,
		is_active: true,
		brand_id: brandId
	};

	if (isNew) {
		const { data, error } = await supabase
			.from('products')
			.insert([productData])
			.select('id')
			.single();

		if (error) throw error;
		return data;
	} else {
		const { data, error } = await supabase
			.from('products')
			.update(productData)
			.eq('id', product.id)
			.select('id')
			.single();

		if (error) throw error;
		return data;
	}
}

/**
 * Uploads product images to storage and creates database records
 * Uses Supabase Admin client to bypass row-level security policies
 * @param productId The ID of the product to associate images with
 * @param imageFiles The file list containing images to upload
 * @param productName The name of the product (used for alt text)
 * @returns Promise with array of upload results, including any errors
 */
export async function uploadProductImages(
	productId: number,
	imageFiles: FileList,
	productName: string
): Promise<{ success: boolean; errors: string[] }> {
	if (!imageFiles || imageFiles.length === 0) return { success: true, errors: [] };

	// Configuration
	const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
	const BUCKET_NAME = 'products';
	const FOLDER_PATH = 'product-images';

	const errors: string[] = [];
	const uploadPromises = [];

	for (let i = 0; i < imageFiles.length; i++) {
		const file = imageFiles[i];
		
		// Validate file type
		if (!ALLOWED_TYPES.includes(file.type)) {
			errors.push(`File "${file.name}" is not a supported image type. Supported types are JPEG, PNG, WebP, and GIF.`);
			continue;
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			errors.push(`File "${file.name}" exceeds the maximum size of 5MB.`);
			continue;
		}

		// Generate a safe filename with UUID-like uniqueness
		const fileExt = file.name.split('.').pop() || 'jpg';
		const safeFileName = `${productId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
		const filePath = `${FOLDER_PATH}/${safeFileName}`;

		const uploadPromise = (async () => {
			try {
				// Use supabaseAdmin to upload the file to bypass RLS
				const { error: uploadError } = await supabaseAdmin
					.storage
					.from(BUCKET_NAME)
					.upload(filePath, file, {
						cacheControl: '3600',
						upsert: false
					});

				if (uploadError) {
					errors.push(`Failed to upload "${file.name}": ${uploadError.message}`);
					return;
				}

				// Get the public URL for the file
				const { data: publicUrlData } = supabaseAdmin
					.storage
					.from(BUCKET_NAME)
					.getPublicUrl(filePath);

				if (!publicUrlData || !publicUrlData.publicUrl) {
					errors.push(`Failed to get public URL for "${file.name}"`);
					return;
				}
				
				const { data: insertData, error: insertError } = await supabaseAdmin
					.from('product_images')
					.insert([{
						product_id: productId,
						url: publicUrlData.publicUrl,
						alt_text: `${productName} - Image ${i + 1}`,
						position: i
					}])
					.select('id');

				if (insertError) {
					console.error('Database insert error details:', insertError);
					errors.push(`Failed to create database record for "${file.name}": ${insertError.message}`);
					
					await supabaseAdmin.storage.from(BUCKET_NAME).remove([filePath]);
					return;
				}
				
				console.log(`Successfully inserted image record with ID: ${insertData?.[0]?.id}`);
			} catch (err) {
				errors.push(`Unexpected error processing "${file.name}": ${err instanceof Error ? err.message : String(err)}`);
			}
		})();

		uploadPromises.push(uploadPromise);
	}

	await Promise.all(uploadPromises);

	return {
		success: errors.length === 0,
		errors
	};
}

/**
 * Deletes a product image
 * Uses Supabase Admin client to bypass row-level security policies
 * @param imageId The ID of the image to delete
 * @returns Promise with success status or throws error
 */
export async function deleteProductImage(imageId: number): Promise<boolean> {
	// First get the image URL to delete the file from storage using admin client
	const { data: imageData, error: fetchError } = await supabaseAdmin
		.from('product_images')
		.select('url')
		.eq('id', imageId)
		.single();

	if (fetchError) throw fetchError;

	// Delete the database record first using admin client
	const { error: deleteError } = await supabaseAdmin
		.from('product_images')
		.delete()
		.eq('id', imageId);

	if (deleteError) throw deleteError;

	if (imageData?.url) {
		try {
			const BUCKET_NAME = 'products';
			const storageUrl = new URL(imageData.url);
			
			let storagePath: string | null = null;
			
			const pathRegex = new RegExp(`/storage/v1/object/public/${BUCKET_NAME}/(.+)`);
			const match = storageUrl.pathname.match(pathRegex);
			
			if (match && match[1]) {
				storagePath = match[1];
			} else {
				const parts = storageUrl.pathname.split(BUCKET_NAME + '/');
				if (parts.length > 1) {
					storagePath = parts[1];
				}
			}

			if (storagePath) {
				storagePath = decodeURIComponent(storagePath);
				
				console.log(`Deleting file from storage: ${storagePath}`);
				const { error: removeError } = await supabaseAdmin
					.storage
					.from(BUCKET_NAME)
					.remove([storagePath]);
					
				if (removeError) {
					console.warn('Error removing file from storage:', removeError);
				}
			} else {
				console.warn('Could not extract storage path from URL:', imageData.url);
			}
		} catch (err) {
			console.warn('Could not parse storage URL or delete file:', err);
		}
	}

	return true;
}

/**
 * Soft-deletes a product by setting is_active to false
 * @param productId The ID of the product to delete
 * @returns Promise with success status or throws error
 */
export async function deleteProduct(productId: number): Promise<boolean> {
	const { error } = await supabase
		.from('products')
		.update({ is_active: false })
		.eq('id', productId);

	if (error) throw error;
	return true;
}

/**
 * Updates a product's category
 * @param productId The ID of the product to update
 * @param categoryId The ID of the category to assign
 * @returns Promise with success status or throws error
 */
export async function updateProductCategory(
	productId: number,
	categoryId: number
): Promise<boolean> {
	try {
		const { data: existingCat, error: checkError } = await supabase
			.from('product_categories')
			.select('*')
			.eq('product_id', productId)
			.limit(1);

		if (checkError) throw checkError;

		if (existingCat && existingCat.length > 0) {
			const { error: updateError } = await supabase
				.from('product_categories')
				.update({ category_id: categoryId })
				.eq('product_id', productId);

			if (updateError) throw updateError;
		} else {
			const { error: insertError } = await supabase
				.from('product_categories')
				.insert([{
					product_id: productId,
					category_id: categoryId
				}]);

			if (insertError) throw insertError;
		}

		return true;
	} catch (err) {
		console.error('Error updating product category:', err);
		throw err;
	}
}

/**
 * Loads all categories from the database
 * @returns Promise with array of categories containing id and name
 */
export async function loadCategories(): Promise<{ id: number, name: string }[]> {
	try {
		const { data, error } = await supabase
			.from('categories')
			.select('id, name')
			.order('name');

		if (error) throw error;
		return data || [];
	} catch (err) {
		console.error('Error loading categories:', err);
		throw new Error('Failed to load categories');
	}
}

/**
 * Gets a product's current category
 * @param productId The ID of the product
 * @returns Promise with the category ID and name if found, or null if not
 */
export async function getProductCategory(productId: number): Promise<{ id: number, name: string } | null> {
	try {
		const { data: joinData, error: joinError } = await supabase
			.from('product_categories')
			.select('category_id')
			.eq('product_id', productId)
			.limit(1)
			.single();

		if (joinError) {
			if (joinError.code === 'PGRST116') { // No results found
				return null;
			}
			throw joinError;
		}

		if (!joinData || !joinData.category_id) return null;

		// Then get the category details
		const categoryId = joinData.category_id;
		const { data: categoryData, error: categoryError } = await supabase
			.from('categories')
			.select('id, name')
			.eq('id', categoryId)
			.single();

		if (categoryError) throw categoryError;
		if (!categoryData) return null;

		// Return the category information
		return {
			id: categoryData.id,
			name: categoryData.name
		};
	} catch (err) {
		console.error('Error getting product category:', err);
		return null;
	}
}

/**
 * Removes a product's category assignment
 * @param productId The ID of the product
 * @returns Promise with success status or throws error
 */
export async function removeProductCategory(productId: number): Promise<boolean> {
	try {
		const { error } = await supabase
			.from('product_categories')
			.delete()
			.eq('product_id', productId);

		if (error) throw error;
		return true;
	} catch (err) {
		console.error('Error removing product category:', err);
		throw err;
	}
}

/**
 * Creates a product image entry in the database
 * Uses Supabase Admin client to bypass row-level security policies
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
	const { data, error } = await supabaseAdmin
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


