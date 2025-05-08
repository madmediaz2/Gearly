import { supabase } from '../supabaseClient';

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

/**
 * Fetches all categories
 * @returns Promise with category data
 */
export async function fetchCategories() {
	const { data, error } = await supabase
		.from('categories')
		.select('id, name, slug')
		.order('name');

	if (error) throw error;
	return data || [];
}

/**
 * Associates a product with a category
 * @param productId The ID of the product
 * @param categoryId The ID of the category
 * @returns Promise with operation result
 */
export async function associateProductWithCategory(productId: number, categoryId: number) {
	const { error } = await supabase
		.from('product_categories')
		.upsert([{
			product_id: productId,
			category_id: categoryId
		}])
		.select('id')
		.single();
		
	if (error) throw error;
	return { success: true };
}

/**
 * Removes association between a product and a category
 * @param productId The ID of the product
 * @param categoryId The ID of the category
 * @returns Promise with operation result
 */
export async function removeProductCategoryAssociation(productId: number, categoryId: number) {
	const { error } = await supabase
		.from('product_categories')
		.delete()
		.match({
			product_id: productId,
			category_id: categoryId
		});
		
	if (error) throw error;
	return { success: true };
}
