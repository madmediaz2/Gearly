import { supabase } from '../supabaseClient';

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
 * Loads all brands from the database
 * @returns Promise with array of brands containing id and name
 */
export async function loadBrands(): Promise<{ id: number, name: string }[]> {
	try {
		const { data, error } = await supabase
			.from('brands')
			.select('id, name')
			.order('name');

		if (error) throw error;
		return data || [];
	} catch (err) {
		console.error('Error loading brands:', err);
		throw new Error('Failed to load brands');
	}
}

/**
 * Finds a brand ID by name
 * @param brandName The name of the brand to search for
 * @returns Promise with the brand ID if found, or null if not
 */
export async function findBrandIdByName(brandName: string): Promise<number | null> {
	if (!brandName) return null;

	try {
		const { data, error } = await supabase
			.from('brands')
			.select('id')
			.eq('name', brandName)
			.single();

		if (error && error.code !== 'PGRST116') throw error;
		return data ? data.id : null;
	} catch (err) {
		console.error('Error finding brand ID:', err);
		return null;
	}
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
