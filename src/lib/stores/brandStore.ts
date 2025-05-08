import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { fetchBrands, createBrand as createBrandApi, deleteBrand as deleteBrandApi } from '$lib/api/supabaseApi';

// Define the Brand type
type Brand = {
    id: number;
    name: string;
    image_url?: string;
};

// Create the brand stores
export const brands = writable<Brand[]>([]);
export const isBrandsLoading = writable<boolean>(false);
export const brandsError = writable<string | null>(null);
export const selectedBrand = writable<Brand | null>(null);

let cachedBrands: Brand[] = [];

if (browser) {
    const savedBrands = localStorage.getItem('brands');
    // Cache in localStorage
    if (savedBrands) {
        try {
            const parsedBrands = JSON.parse(savedBrands);
            brands.set(parsedBrands);
            cachedBrands = parsedBrands;
        } catch (e) {
            console.error('Failed to parse saved brands:', e);
        }
    }

    // Subscribe to brands changes for localStorage
    brands.subscribe(items => {
        if (items.length > 0) {
            localStorage.setItem('brands', JSON.stringify(items));
            cachedBrands = items;
        }
    });
}

/**
 * Loads all brands from the database and updates the store
 * @param forceRefresh If true, forces a refresh from database regardless of cache
 * @returns Promise with the loaded brands
 */
export async function loadAllBrands(forceRefresh: boolean = false): Promise<Brand[]> {
    // Return cached brands if they exist and no refresh is required
    if (!forceRefresh && cachedBrands.length > 0) {
        brands.set(cachedBrands);
        return cachedBrands;
    }

    isBrandsLoading.set(true);
    brandsError.set(null);
    
    try {
        const items = await fetchBrands();
        brands.set(items);
        cachedBrands = items;
        return items;
    } catch (error) {
        console.error('Error fetching brands:', error);
        if (error instanceof Error) {
            brandsError.set(error.message);
        } else {
            brandsError.set('Failed to load brands');
        }
        return [];
    } finally {
        isBrandsLoading.set(false);
    }
}

/**
 * Gets a single brand by ID
 * First checks the cache, then fetches from store
 * @param brandId The ID of the brand to get
 * @returns Brand if found, or null if not
 */
export function getBrandById(brandId: number): Brand | null {
    // Try to find the brand in the cache first
    const cachedBrand = cachedBrands.find(brand => brand.id === brandId);
    if (cachedBrand) {
        selectedBrand.set(cachedBrand);
        return cachedBrand;
    }

    // Also check the store in case it has items the cache doesn't
    const storeBrands = get(brands);
    const storeBrand = storeBrands.find(brand => brand.id === brandId);
    if (storeBrand) {
        selectedBrand.set(storeBrand);
        return storeBrand;
    }

    return null;
}

/**
 * Gets a single brand by name
 * @param brandName The name of the brand to get
 * @returns Brand if found, or null if not
 */
export function getBrandByName(brandName: string): Brand | null {
    if (!brandName) return null;
    
    const normalizedName = brandName.toLowerCase();
    
    // Try to find the brand in the cache first
    const cachedBrand = cachedBrands.find(brand => 
        brand.name.toLowerCase() === normalizedName
    );
    if (cachedBrand) {
        selectedBrand.set(cachedBrand);
        return cachedBrand;
    }

    // Also check the store
    const storeBrands = get(brands);
    const storeBrand = storeBrands.find(brand => 
        brand.name.toLowerCase() === normalizedName
    );
    if (storeBrand) {
        selectedBrand.set(storeBrand);
        return storeBrand;
    }

    return null;
}

/**
 * Filters brands based on a search term
 * @param searchTerm The term to search for in brand names
 * @returns Array of brands that match the search term
 */
export function filterBrands(searchTerm: string): Brand[] {
    if (!searchTerm.trim()) {
        return get(brands);
    }
    
    const normalizedTerm = searchTerm.toLowerCase();
    return get(brands).filter(brand => {
        return brand.name.toLowerCase().includes(normalizedTerm);
    });
}

/**
 * Creates a new brand and updates the store
 * @param name The name of the brand to create
 * @param imageFile Optional image file to upload for the brand
 * @returns Promise with the created brand data
 */
export async function createBrand(name: string, imageFile?: File): Promise<Brand> {
    brandsError.set(null);
    
    try {
        const brandData = await createBrandApi(name, imageFile);
        
        // Refresh brands to include the new one
        await loadAllBrands(true);
        
        return { ...brandData, name };
    } catch (error) {
        console.error('Error creating brand:', error);
        if (error instanceof Error) {
            brandsError.set(error.message);
        } else {
            brandsError.set('Failed to create brand');
        }
        throw error;
    }
}

/**
 * Deletes a brand and updates the store
 * @param brandId The ID of the brand to delete
 * @returns Promise with operation result
 */
export async function deleteBrand(brandId: number): Promise<{ success: boolean }> {
    brandsError.set(null);
    
    try {
        const result = await deleteBrandApi(brandId);
        
        // Update the store by filtering out the deleted brand
        brands.update(currentBrands => 
            currentBrands.filter(brand => brand.id !== brandId)
        );
        
        // Also update the cache
        cachedBrands = cachedBrands.filter(brand => brand.id !== brandId);
        
        if (browser) {
            localStorage.setItem('brands', JSON.stringify(cachedBrands));
        }
        
        return result;
    } catch (error) {
        console.error('Error deleting brand:', error);
        if (error instanceof Error) {
            brandsError.set(error.message);
        } else {
            brandsError.set('Failed to delete brand');
        }
        throw error;
    }
}

/**
 * Clears the brand cache and resets the store
 */
export function clearBrandCache(): void {
    brands.set([]);
    selectedBrand.set(null);
    cachedBrands = [];
    
    if (browser) {
        localStorage.removeItem('brands');
    }
}
