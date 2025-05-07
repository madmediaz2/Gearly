// filepath: /Users/diaz/Developer/examen/Gearly/src/lib/api/specificationsApi.ts
import { supabase } from '../supabaseClient';
import type { SpecificationAttribute } from '../types/supabaseTypes';

/**
 * Fetches all specification attributes
 * @returns Promise with all specification attributes
 */
export async function fetchSpecificationAttributes(): Promise<SpecificationAttribute[]> {
	const { data, error } = await supabase
		.from('specification_attributes')
		.select('*')
		.order('name');

	if (error) throw error;
	return data || [];
}

/**
 * Fetches a single specification attribute by ID
 * @param id The ID of the specification attribute to fetch
 * @returns Promise with the specification attribute data
 */
export async function fetchSpecificationAttributeById(id: number): Promise<SpecificationAttribute | null> {
	const { data, error } = await supabase
		.from('specification_attributes')
		.select('*')
		.eq('id', id)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {  // Code for "no rows returned"
			return null;
		}
		throw error;
	}

	return data;
}

/**
 * Creates a new specification attribute
 * @param specificationData The specification attribute data to create
 * @returns Promise with the created specification attribute
 */
export async function createSpecificationAttribute(
	specificationData: Partial<SpecificationAttribute>
): Promise<SpecificationAttribute> {
	const { data, error } = await supabase
		.from('specification_attributes')
		.insert([{
			name: specificationData.name,
			slug: specificationData.slug || specificationData.name?.toLowerCase().replace(/\s+/g, '-'),
			unit: specificationData.unit || null,
		}])
		.select()
		.single();

	if (error) throw error;
	return data;
}

/**
 * Updates an existing specification attribute
 * @param id The ID of the specification attribute to update
 * @param specificationData The updated specification attribute data
 * @returns Promise with the updated specification attribute
 */
export async function updateSpecificationAttribute(
	id: number,
	specificationData: Partial<SpecificationAttribute>
): Promise<SpecificationAttribute> {
	const { data, error } = await supabase
		.from('specification_attributes')
		.update({
			name: specificationData.name,
			slug: specificationData.slug,
			unit: specificationData.unit,
		})
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return data;
}

/**
 * Deletes a specification attribute
 * @param id The ID of the specification attribute to delete
 * @returns Promise with operation result
 */
export async function deleteSpecificationAttribute(id: number): Promise<{ success: boolean }> {
	const { error } = await supabase
		.from('specification_attributes')
		.delete()
		.eq('id', id);

	if (error) throw error;
	return { success: true };
}

/**
 * Gets all specifications for a product
 * @param productId The ID of the product
 * @returns Promise with product specifications and their attributes
 */
export async function getProductSpecifications(productId: number): Promise<Array<{
	attribute: SpecificationAttribute;
	value: string;
}>> {
	const { data, error } = await supabase
		.from("product_specifications")
		.select(`
      product_id,
      value,
      specification_attributes!inner(id, name, slug, unit)
    `)
		.eq('product_id', productId);

	if (error) throw error;

	// Use type assertion and a manual transformation to handle the data structure
	return (data || [])
		.filter(item => item.specification_attributes)
		.map(item => {
			// Get the first item if specification_attributes is an array or use as is
			const attributeData = Array.isArray(item.specification_attributes)
				? item.specification_attributes[0]
				: item.specification_attributes;

			return {
				attribute: {
					id: attributeData.id,
					name: attributeData.name,
					slug: attributeData.slug,
					unit: attributeData.unit
				} as SpecificationAttribute,
				value: item.value
			};
		});
}

/**
 * Sets a specification value for a product
 * @param productId The ID of the product
 * @param attributeId The ID of the specification attribute
 * @param value The value to set
 * @returns Promise with operation result
 */
export async function setProductSpecification(
	productId: number,
	attributeId: number,
	value: string
): Promise<{ success: boolean }> {
	const { error } = await supabase
		.from('product_specifications')
		.upsert([{
			product_id: productId,
			specification_attribute_id: attributeId,
			value
		}], {
			onConflict: 'product_id,specification_attribute_id'
		});

	if (error) throw error;
	return { success: true };
}

/**
 * Removes a specification from a product
 * @param productId The ID of the product
 * @param attributeId The ID of the specification attribute
 * @returns Promise with operation result
 */
export async function removeProductSpecification(
	productId: number,
	attributeId: number
): Promise<{ success: boolean }> {
	const { error } = await supabase
		.from('product_specifications')
		.delete()
		.eq('product_id', productId)
		.eq('specification_attribute_id', attributeId);

	if (error) throw error;
	return { success: true };
}
