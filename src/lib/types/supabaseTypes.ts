// Type definitions to match Supabase schema

export interface Brand {
	id: number;
	name: string;
	image_url: string | null;
}

export interface ProductImage {
	id: number;
	url: string;
	alt_text: string | null;
	position: number;
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
}


export interface ProductItem{
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
	product_id: number;
	variant: string | null;
}

export type ShopItem = ProductItem;
export type CartItem = ProductItem;
