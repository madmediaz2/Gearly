<script lang="ts">
    import ShopItem from "../components/ShopItem.svelte";
    import { cart, addToCart } from "../lib/stores/cart";
    import type { CartItem } from "$lib/stores/cart";
    import { fetchShopItems } from "$lib/supabaseClient";
    import { onMount } from "svelte";

    let shopItems = $state<CartItem[]>([]);
    let isLoading = $state(true);
    let error = $state<string | null>();

    // Fetch shop items from Supabase
    async function loadItems() {
        isLoading = true;
        error = null;
        try {
            shopItems = await fetchShopItems();
        } catch (err: any) {
            console.error('Error loading shop items:', err);
            error = err.message || 'Failed to load shop items';
        } finally {
            isLoading = false;
        }
    }

    // Add item to cart
    function onAddToCart(item: CartItem) {
        addToCart(item);
    }

    onMount(() => {
        loadItems();
    })
</script>

<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Featured Products</h1>

    {#if isLoading}
        <div class="flex justify-center items-center py-10">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
        </div>
    {:else if error}
        <div class="bg-red-100 text-red-700 p-4 rounded-md">
            <p>{error}</p>
        </div>
    {:else if shopItems.length === 0}
        <div class="text-center py-10">
            <p>No products found.</p>
        </div>
    {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {#each shopItems as item (item.id)}
                <div class="flex justify-center">
                    <ShopItem cartItem={item} onAddToCart={() => onAddToCart(item)} />
                </div>
            {/each}
        </div>
    {/if}
</div>