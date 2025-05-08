<script lang="ts">
    import ShopItem from "../components/ShopItem.svelte";
    import { addToCart } from "../lib/stores/cart";
    import type { ProductItem } from "$lib/types/supabaseTypes";
    import { onMount } from "svelte";
    import { shopItems, isShopItemsLoading, shopItemsError, loadShopItems } from "../lib/stores/shopItemStore";

    // Reactive store bindings
    let isLoading = $state(false);
    let items = $state<ProductItem[]>([]);
    let error = $state<string | null>(null);

    $effect(() => {
        isLoading = $isShopItemsLoading;
        items = $shopItems;
        error = $shopItemsError;
    });

    // Add item to cart
    function onAddToCart(item: ProductItem) {
        addToCart(item);
    }

    onMount(() => {
        loadShopItems();
    })
</script>

{#snippet LoadingSpinner()}
    <div class="flex justify-center items-center py-10">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
    </div>
{/snippet}

{#snippet ErrorMessage(message: string)}
    <div class="bg-red-100 text-red-700 p-4 rounded-md">
        <p>{message}</p>
    </div>
{/snippet}

{#snippet EmptyState()}
    <div class="text-center py-10">
        <p>No products found.</p>
    </div>
{/snippet}

{#snippet ProductGrid(products: ProductItem[])}
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {#each products as item (item.id)}
            <div class="flex justify-center">
                <ShopItem cartItem={item} onAddToCart={() => onAddToCart(item)} />
            </div>
        {/each}
    </div>
{/snippet}

<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Featured Products</h1>

    {#if isLoading}
        {@render LoadingSpinner()}
    {:else if error}
        {@render ErrorMessage(error)}
    {:else if items.length === 0}
        {@render EmptyState()}
    {:else}
        {@render ProductGrid(items)}
    {/if}
</div>