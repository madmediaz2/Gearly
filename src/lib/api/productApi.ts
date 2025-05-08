import { supabase } from '../supabaseClient';
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
 * @param productId The ID of the product to associate images with
 * @param imageFiles The file list containing images to upload
 * @param productName The name of the product (used for alt text)
 * @returns Promise that resolves when all uploads are complete
 */
export async function uploadProductImages(
	productId: number,
	imageFiles: FileList,
	productName: string
): Promise<void> {
	if (!imageFiles || imageFiles.length === 0) return;

	for (let i = 0; i < imageFiles.length; i++) {
		const file = imageFiles[i];
		const fileExt = file.name.split('.').pop();
		const fileName = `${productId}_${Date.now()}_${i}.${fileExt}`;
		const filePath = `product-images/${fileName}`;

		const { error: uploadError } = await supabase
			.storage
			.from('products')
			.upload(filePath, file);

		if (uploadError) {
			console.error('Error uploading image:', uploadError);
			continue;
		}

		const { data: publicUrl } = supabase
			.storage
			.from('products')
			.getPublicUrl(filePath);

		if (!publicUrl) continue;

		await supabase
			.from('product_images')
			.insert([{
				product_id: productId,
				url: publicUrl.publicUrl,
				alt_text: productName,
				position: i
			}]);
	}
}

/**
 * Deletes a product image
 * @param imageId The ID of the image to delete
 * @returns Promise with success status or throws error
 */
export async function deleteProductImage(imageId: number): Promise<boolean> {
	// First get the image URL to delete the file from storage
	const { data: imageData, error: fetchError } = await supabase
		.from('product_images')
		.select('url')
		.eq('id', imageId)
		.single();

	if (fetchError) throw fetchError;

	// Delete the database record
	const { error: deleteError } = await supabase
		.from('product_images')
		.delete()
		.eq('id', imageId);

	if (deleteError) throw deleteError;

	// Delete the file from storage if URL exists
	if (imageData?.url) {
		try {
			const storageUrl = new URL(imageData.url);
			const pathParts = storageUrl.pathname.split('/');
			const storagePath = pathParts.slice(2).join('/');

			if (storagePath) {
				await supabase
					.storage
					.from('products')
					.remove([storagePath]);
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


