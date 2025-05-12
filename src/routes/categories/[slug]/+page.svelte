<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { 
        loadShopItems, 
        getItemsByCategory,
        isShopItemsLoading,
        shopItemsError
    } from "$lib/stores/shopItemStore";
    import type { ProductItem } from "$lib/types/supabaseTypes";
    import ShopItem from "../../../components/ShopItem.svelte";
    import { 
        getCategoryByName, 
        getCategoryBySlug,
        loadAllCategories, 
        isCategoriesLoading,
        categoriesError 
    } from "$lib/stores/categoryStore";
    import type { Category } from "$lib/stores/categoryStore";

    let categorySlug = $state<string>("");
    let categoryInfo = $state<Category | null>(null);
    let products = $state<ProductItem[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);


    $effect(() => {
        categorySlug = $page.params.slug;
        loadCategoryProducts();
    });

    async function loadCategoryProducts() {
        loading = true;
        error = null;
        
        try {
            await loadAllCategories();
                        
            // First try to get the category by slug
            const categoryBySlug = getCategoryBySlug(categorySlug);
            
            if (categoryBySlug) {
                categoryInfo = categoryBySlug;
            } else {
                const matchingCategories = getCategoryByName(categorySlug);
                
                if (matchingCategories.length === 0) {
                    error = `Category "${categorySlug}" not found`;
                    return;
                }
                
                categoryInfo = matchingCategories[0];
            }
            
            if (categoryInfo) {
                await loadShopItems(true);
                
                products = getItemsByCategory(categoryInfo.name);
            } else {
                console.error("Category processing error - categoryInfo is null");
                error = "Failed to process category information";
            }
        } catch (err) {
            console.error("Error loading category products:", err);
            if (err instanceof Error) {
                error = err.message;
            } else {
                error = "Failed to load products for this category";
            }
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadCategoryProducts();
    });
</script>

{#snippet CategoryHeader()}
    <div class="bg-gray-100 py-6 mb-8">
        <div class="container mx-auto px-4">
            <h1 class="text-3xl font-bold text-gray-900">
                {categoryInfo ? categoryInfo.name : 'Loading...'}
            </h1>
            {#if products.length > 0}
                <p class="text-gray-600 mt-2">{products.length} product{products.length !== 1 ? 's' : ''} found</p>
            {/if}
        </div>
    </div>
{/snippet}

{#snippet ProductsList()}
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {#each products as product}
            <ShopItem {product} />
        {/each}
    </div>
{/snippet}

{#snippet LoadingState()}
    <div class="flex justify-center items-center py-12">
        <div class="animate-pulse text-gray-600">
            <p>Loading products...</p>
        </div>
    </div>
{/snippet}

{#snippet ErrorState()}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md my-6">
        <p>{error}</p>
    </div>
{/snippet}

{#snippet EmptyState()}
    <div class="text-center py-12 bg-gray-50 rounded-lg">
        <h3 class="text-xl font-medium text-gray-700">No products found</h3>
        <p class="mt-2 text-gray-500">There are no products available in this category yet.</p>
    </div>
{/snippet}

<div class="min-h-screen">
    <!-- Category Header -->
    {@render CategoryHeader()}
    
    <div class="container mx-auto px-4 pb-12">
        <!-- Show loading state -->
        {#if loading || $isShopItemsLoading || $isCategoriesLoading}
            {@render LoadingState()}
        <!-- Show error message -->
        {:else if error || $shopItemsError || $categoriesError}
            {@render ErrorState()}
        <!-- No products available -->
        {:else if !products.length}
            {@render EmptyState()}
        <!-- Show products -->
        {:else}
            {@render ProductsList()}
        {/if}
    </div>
</div>
