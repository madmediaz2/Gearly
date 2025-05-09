// Type definitions to match Supabase schema

export interface Brand {
	id: number;
	name: string;
	image_url: string | null;
}

export interface Category {
	id: number;
	name: string;
	slug: string;
}

export interface ProductImage {
	id: number;
	url: string;
	alt_text: string | null;
	position: number;
}

// Specification attribute definition
export interface SpecificationAttribute {
	id: number;
	name: string;
	slug: string;
	unit: string | null | undefined;
	created_at?: string;
}

// Product specification (join between product and attribute)
export interface ProductSpecification {
	product_id: number;
	specification_attribute_id: number;
	value: string;
}

// Type for products with their images
export type ProductWithImages = {
	id: number;
	name: string;
	price: number;
	description: string | null;
	sku: string | null;
	stock: number;
	is_active: boolean;
	brand_id: number | null;
	product_images: ProductImage[];
	product_specifications?: {
		specification_attribute_id: number;
		value: string;
		specification_attributes: SpecificationAttribute;
	}[];
}

export interface ProductItem {
	id: number;
	name: string;
	price: number;
	quantity: number;
	brand_name: string | null | undefined;
	brand_image: string | null;
	image_url: string | null;    
	image: string;
	description: string;
	sku: string;
	stock: number;
	cart_id?: string;
	variant: string | null;
	product_images?: ProductImage[];
	category?: string;
	specifications?: {
		attribute: SpecificationAttribute;
		value: string;
	}[];
}

export type ShopItem = Partial<ProductItem>;
export type CartItem = Partial<ProductItem>;
