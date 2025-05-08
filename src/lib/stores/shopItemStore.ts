import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { fetchShopItems, fetchProductById } from '$lib/api/supabaseApi';
import type { ProductItem } from '$lib/types/supabaseTypes';

// Create the shop item stores
export const shopItems = writable<ProductItem[]>([]);
export const isShopItemsLoading = writable<boolean>(false);
export const shopItemsError = writable<string | null>(null);
export const selectedShopItem = writable<ProductItem | null>(null);

let cachedItems: ProductItem[] = [];

if (browser) {
    const savedItems = localStorage.getItem('shopItems');
    //Cache in localstorage
    if (savedItems) {
        try {
            const parsedItems = JSON.parse(savedItems);
            shopItems.set(parsedItems);
            cachedItems = parsedItems;
        } catch (e) {
            console.error('Failed to parse saved shop items:', e);
        }
    }

    // Subscribe to shop items changes for localStorage
    shopItems.subscribe(items => {
        if (items.length > 0) {
            localStorage.setItem('shopItems', JSON.stringify(items));
            cachedItems = items;
        }
    });
}

/**
 * Loads all shop items from the database and updates the store
 * @param forceRefresh If true, forces a refresh from database regardless of cache
 * @returns Promise with the loaded shop items
 */
export async function loadShopItems(forceRefresh: boolean = false): Promise<ProductItem[]> {
    // Return cached items if they exist and no refresh is required
    if (!forceRefresh && cachedItems.length > 0) {
        shopItems.set(cachedItems);
        return cachedItems;
    }

    isShopItemsLoading.set(true);
    shopItemsError.set(null);
    
    try {
        const items = await fetchShopItems();
        shopItems.set(items);
        cachedItems = items;
        return items;
    } catch (error) {
        console.error('Error fetching shop items:', error);
        if (error instanceof Error) {
            shopItemsError.set(error.message);
        } else {
            shopItemsError.set('Failed to load shop items');
        }
        return [];
    } finally {
        isShopItemsLoading.set(false);
    }
}

/**
 * Gets a single shop item by ID
 * First checks the cache, then fetches from database if not found
 * @param itemId The ID of the shop item to get
 * @param forceRefresh If true, forces a refresh from database regardless of cache
 * @returns Promise with the shop item if found, or null if not
 */
export async function getShopItemById(itemId: number | string, forceRefresh: boolean = false): Promise<ProductItem | null> {
    // Try to find the item in the cache first
    if (!forceRefresh) {
        const cachedItem = cachedItems.find(item => item.id.toString() === itemId.toString());
        if (cachedItem) {
            selectedShopItem.set(cachedItem);
            return cachedItem;
        }

        // Also check the store in case it has items the cache doesn't
        const storeItems = get(shopItems);
        const storeItem = storeItems.find(item => item.id.toString() === itemId.toString());
        if (storeItem) {
            selectedShopItem.set(storeItem);
            return storeItem;
        }
    }

    // If not in cache or refresh is required, fetch from database
    isShopItemsLoading.set(true);
    shopItemsError.set(null);
    
    try {
        const item = await fetchProductById(itemId);
        if (item) {
            selectedShopItem.set(item);
            
            // Update the item in the cache if found
            const index = cachedItems.findIndex(i => i.id.toString() === itemId.toString());
            if (index > -1) {
                cachedItems[index] = item;
                shopItems.set([...cachedItems]);
            }
        }
        return item;
    } catch (error) {
        console.error(`Error fetching shop item with ID ${itemId}:`, error);
        if (error instanceof Error) {
            shopItemsError.set(error.message);
        } else {
            shopItemsError.set(`Failed to load shop item with ID ${itemId}`);
        }
        return null;
    } finally {
        isShopItemsLoading.set(false);
    }
}

/**
 * Filters shop items based on a search term
 * @param searchTerm The term to search for in item names, descriptions, etc.
 * @returns Array of shop items that match the search term
 */
export function filterShopItems(searchTerm: string): ProductItem[] {
    if (!searchTerm.trim()) {
        return get(shopItems);
    }
    
    const normalizedTerm = searchTerm.toLowerCase();
    return get(shopItems).filter(item => {
        return (
            item.name.toLowerCase().includes(normalizedTerm) ||
            (item.description && item.description.toLowerCase().includes(normalizedTerm)) ||
            (item.brand_name && item.brand_name.toLowerCase().includes(normalizedTerm))
        );
    });
}

/**
 * Gets shop items from a specific brand
 * @param brandName The name of the brand to filter by
 * @returns Array of shop items from that brand
 */
export function getItemsByBrand(brandName: string): ProductItem[] {
    return get(shopItems).filter(item => 
        item.brand_name && item.brand_name.toLowerCase() === brandName.toLowerCase()
    );
}

/**
 * Gets shop items from a specific category
 * @param category The category to filter by
 * @returns Array of shop items in that category
 */
export function getItemsByCategory(category: string): ProductItem[] {
    return get(shopItems).filter(item => 
        item.category && item.category.toLowerCase() === category.toLowerCase()
    );
}

/**
 * Clears the shop item cache and resets the store
 */
export function clearShopItemCache(): void {
    shopItems.set([]);
    selectedShopItem.set(null);
    cachedItems = [];
    
    if (browser) {
        localStorage.removeItem('shopItems');
    }
}

/**
 * Updates the stock levels of products in the cache after checkout
 * @param purchasedProductIds Array of product IDs that were purchased
 * @returns Promise that resolves when cache is updated
 */
export async function updateStockAfterCheckout(purchasedProductIds: number[]): Promise<void> {
    if (!purchasedProductIds || purchasedProductIds.length === 0) {
        return;
    }

    try {
        const response = await fetch(`/api/update-stock-cache?productIds=${purchasedProductIds.join(',')}`);
        
        if (!response.ok) {
            console.error('Failed to fetch updated stock levels:', await response.text());
            return;
        }
        
        const data = await response.json();
        
        if (!data.success || !data.products) {
            console.error('Invalid response from update-stock-cache:', data);
            return;
        }
        
        shopItems.update(items => {
            return items.map(item => {
                const updatedProduct = data.products.find((p: ProductItem) => p.id === item.id);
                if (updatedProduct) {
                    return { 
                        ...item, 
                        stock: updatedProduct.stock,
                        price: updatedProduct.price || item.price
                    };
                }
                return item;
            });
        });
        
        cachedItems = cachedItems.map(item => {
            const updatedProduct = data.products.find((p: ProductItem) => p.id === item.id);
            if (updatedProduct) {
                return { 
                    ...item, 
                    stock: updatedProduct.stock,
                    price: updatedProduct.price || item.price
                };
            }
            return item;
        });
        
        const selectedItem = get(selectedShopItem);
        if (selectedItem) {
            const updatedProduct = data.products.find((p: ProductItem) => p.id === selectedItem.id);
            if (updatedProduct) {
                selectedShopItem.update(item => {
                    if (item) {
                        return {
                            ...item,
                            stock: updatedProduct.stock,
                            price: updatedProduct.price || item.price
                        };
                    }
                    return item;
                });
            }
        }

        console.log('Shop item cache updated with new stock levels');
    } catch (error) {
        console.error('Error updating shop item cache after checkout:', error);
    }
}
