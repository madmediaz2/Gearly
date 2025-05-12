// filepath: /Users/diaz/Developer/examen/Gearly/src/lib/stores/categoryStore.ts
import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { 
    fetchCategories, 
    createCategory as createCategoryApi, 
    deleteCategory as deleteCategoryApi,
    associateProductWithCategory as associateProductWithCategoryApi,
    removeProductCategoryAssociation as removeProductCategoryAssociationApi
} from '$lib/api/categoryApi';

// Define the Category type
export interface Category {
    id: number;
    name: string;
    slug: string;
}

// Create the category stores
export const categories = writable<Category[]>([]);
export const isCategoriesLoading = writable<boolean>(false);
export const categoriesError = writable<string | null>(null);
export const selectedCategory = writable<Category | null>(null);

let cachedCategories: Category[] = [];

if (browser) {
    const savedCategories = localStorage.getItem('categories');
    // Cache in localStorage
    if (savedCategories) {
        try {
            const parsedCategories = JSON.parse(savedCategories);
            categories.set(parsedCategories);
            cachedCategories = parsedCategories;
        } catch (e) {
            console.error('Failed to parse saved categories:', e);
        }
    }

    // Subscribe to categories changes for localStorage
    categories.subscribe(items => {
        if (items.length > 0) {
            localStorage.setItem('categories', JSON.stringify(items));
            cachedCategories = items;
        }
    });
}

/**
 * Loads all categories from the database and updates the store
 * @param forceRefresh If true, forces a refresh from database regardless of cache
 * @returns Promise with the loaded categories
 */
export async function loadAllCategories(forceRefresh: boolean = false): Promise<Category[]> {
    // Return cached categories if they exist and no refresh is required
    if (!forceRefresh && cachedCategories.length > 0) {
        categories.set(cachedCategories);
        return cachedCategories;
    }

    isCategoriesLoading.set(true);
    categoriesError.set(null);
    
    try {
        const items = await fetchCategories();
        categories.set(items);
        cachedCategories = items;
        return items;
    } catch (error) {
        console.error('Error fetching categories:', error);
        if (error instanceof Error) {
            categoriesError.set(error.message);
        } else {
            categoriesError.set('Failed to load categories');
        }
        return [];
    } finally {
        isCategoriesLoading.set(false);
    }
}

/**
 * Gets a single category by ID
 * First checks the cache, then fetches from store
 * @param categoryId The ID of the category to get
 * @returns Category if found, or null if not
 */
export function getCategoryById(categoryId: number): Category | null {
    // Try to find the category in the cache first
    const cachedCategory = cachedCategories.find(category => category.id === categoryId);
    if (cachedCategory) {
        selectedCategory.set(cachedCategory);
        return cachedCategory;
    }

    // Also check the store in case it has items the cache doesn't
    const storeCategories = get(categories);
    const storeCategory = storeCategories.find(category => category.id === categoryId);
    if (storeCategory) {
        selectedCategory.set(storeCategory);
        return storeCategory;
    }

    return null;
}

/**
 * Gets a single category by slug
 * @param slug The slug of the category to get
 * @returns Category if found, or null if not
 */
export function getCategoryBySlug(slug: string): Category | null {
    const cachedCategory = cachedCategories.find(
        category => category.slug.toLowerCase() === slug.toLowerCase()
    );
    if (cachedCategory) {
        selectedCategory.set(cachedCategory);
        return cachedCategory;
    }

    const storeCategories = get(categories);
    const storeCategory = storeCategories.find(
        category => category.slug.toLowerCase() === slug.toLowerCase()
    );
    if (storeCategory) {
        selectedCategory.set(storeCategory);
        return storeCategory;
    }

    return null;
}

/**
 * Gets all categories that match the given name
 * @param name The name of the category to get
 * @returns Array of matching categories
 */
export function getCategoryByName(name: string): Category[] {    
    const normalizedName = name.toLowerCase();
    const matchingCachedCategories = cachedCategories.filter(
        category => category.name.toLowerCase() === normalizedName
    );
    
    const storeCategories = get(categories);    
    const matchingStoreCategories = storeCategories.filter(
        category => category.name.toLowerCase() === normalizedName
    );

    const allMatches = [...matchingCachedCategories];
    matchingStoreCategories.forEach(storeCategory => {
        // Only add if not already in the result list
        if (!allMatches.some(cat => cat.id === storeCategory.id)) {
            allMatches.push(storeCategory);
        }
    });
    
    // If we found any categories, set the first one as the selected category
    if (allMatches.length > 0) {
        selectedCategory.set(allMatches[0]);
    }
    
    return allMatches;
}

/**
 * Creates a new category
 * @param name The name of the new category
 * @param slug Optional slug for the category
 * @returns Promise with the created category ID
 */
export async function createCategory(name: string, slug?: string): Promise<{id: number}> {
    try {
        categoriesError.set(null);
        const result = await createCategoryApi(name, slug);
        
        // Refresh the categories to include the new one
        await loadAllCategories(true);
        
        return result;
    } catch (error) {
        console.error('Error creating category:', error);
        if (error instanceof Error) {
            categoriesError.set(error.message);
        } else {
            categoriesError.set('Failed to create category');
        }
        throw error;
    }
}

/**
 * Deletes a category by ID
 * @param categoryId The ID of the category to delete
 * @returns Promise with success status
 */
export async function deleteCategory(categoryId: number): Promise<{success: boolean}> {
    try {
        categoriesError.set(null);
        const result = await deleteCategoryApi(categoryId);
        
        // Remove from store if successful
        if (result.success) {
            categories.update(items => items.filter(item => item.id !== categoryId));
            cachedCategories = cachedCategories.filter(item => item.id !== categoryId);
            
            // Clear selected category if it was the one deleted
            const selected = get(selectedCategory);
            if (selected && selected.id === categoryId) {
                selectedCategory.set(null);
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error deleting category:', error);
        if (error instanceof Error) {
            categoriesError.set(error.message);
        } else {
            categoriesError.set('Failed to delete category');
        }
        throw error;
    }
}

/**
 * Associate a product with a category
 * @param productId The ID of the product
 * @param categoryId The ID of the category
 * @returns Promise with success status
 */
export async function associateProductWithCategory(productId: number, categoryId: number): Promise<{success: boolean}> {
    try {
        categoriesError.set(null);
        return await associateProductWithCategoryApi(productId, categoryId);
    } catch (error) {
        console.error('Error associating product with category:', error);
        if (error instanceof Error) {
            categoriesError.set(error.message);
        } else {
            categoriesError.set('Failed to associate product with category');
        }
        throw error;
    }
}

/**
 * Remove association between a product and a category
 * @param productId The ID of the product
 * @param categoryId The ID of the category
 * @returns Promise with success status
 */
export async function removeProductCategoryAssociation(productId: number, categoryId: number): Promise<{success: boolean}> {
    try {
        categoriesError.set(null);
        return await removeProductCategoryAssociationApi(productId, categoryId);
    } catch (error) {
        console.error('Error removing product category association:', error);
        if (error instanceof Error) {
            categoriesError.set(error.message);
        } else {
            categoriesError.set('Failed to remove product category association');
        }
        throw error;
    }
}

/**
 * Clears the category cache and resets the store
 */
export function clearCategoryCache(): void {
    categories.set([]);
    selectedCategory.set(null);
    cachedCategories = [];
    
    if (browser) {
        localStorage.removeItem('categories');
    }
}