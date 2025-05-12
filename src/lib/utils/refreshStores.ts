import { loadShopItems } from '$lib/stores/shopItemStore';
import { loadAllCategories } from '$lib/stores/categoryStore';
import { loadAllBrands } from '$lib/stores/brandStore';
import { loadAllAttributes } from '$lib/stores/specificationAttributeStore';

/**
 * Refreshes all stores in the application by forcing them to reload from the database
 * @returns Promise that resolves when all stores are refreshed
 */
export async function refreshAllStores(): Promise<void> {
    try {
        // Force refresh all stores in parallel
        await Promise.all([
            loadShopItems(true),
            loadAllCategories(true),
            loadAllBrands(true),
            loadAllAttributes(true)
        ]);
        
        console.log('All stores successfully refreshed');
        return Promise.resolve();
    } catch (error) {
        console.error('Failed to refresh stores:', error);
        return Promise.reject(error);
    }
}
