import { supabase } from '$lib/supabaseClient';
import type { Brand, ProductItem, ProductWithImages } from '$lib/types/supabaseTypes';

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


export {
	fetchProductById,
	saveProduct,
	uploadProductImages,
	deleteProductImage,
	deleteProduct,
	updateProductCategory,
	loadCategories,
	getProductCategory,
	removeProductCategory,
	createProductImage
} from './productApi';

export {
	fetchCartItems,
	addItemToCart,
	clearCart
} from './cartApi';

export {
	fetchBrands,
	loadBrands,
	findBrandIdByName,
	createBrand,
	deleteBrand
} from './brandApi';

export { 
	createCategory, 
	deleteCategory,
	fetchCategories,
	associateProductWithCategory,
	removeProductCategoryAssociation
} from './categoryApi';

export {
	fetchSpecificationAttributes,
	fetchSpecificationAttributeById,
	createSpecificationAttribute,
	updateSpecificationAttribute,
	deleteSpecificationAttribute,
	getProductSpecifications,
	setProductSpecification,
	removeProductSpecification
} from './specificationsApi';
