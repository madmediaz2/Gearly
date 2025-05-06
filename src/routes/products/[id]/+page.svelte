<script lang="ts">
    import { onMount } from "svelte";
    import { fetchProductById, addItemToCart } from "$lib/api/supabaseApi";
    import { page } from "$app/state";
    import { user } from "$lib/stores/authStore";
    import type { ProductItem } from "$lib/types/supabaseTypes";
    import ProductSpecifications from "../../../components/ProductSpecifications.svelte";

    let product = $state<ProductItem | null>();
    let loading = $state(false);
    let error = $state<string>();
    let quantity = $state(1);

    onMount(async () => {
        try {
            const productId = page.params.id;
            product = await fetchProductById(productId);
            if (!product) {
                error = "Product not found";
            }
        } catch (err) {
            console.error("Error fetching product:", err);
            error = "Failed to load product";
        } finally {
            loading = false;
        }
    });

    async function handleAddToCart() {
        if (!$user || !product) return;

        try {
            await addItemToCart($user.id, product.id, quantity);
            alert("Added to cart successfully!");
        } catch (err) {
            console.error("Error adding to cart:", err);
            alert("Failed to add to cart. Please try again.");
        }
    }
</script>

<div class="container mx-16 mt-4 ">
    {#if loading}
        <div class="flex justify-center items-center h-64">
            <p class="text-xl">Loading product...</p>
        </div>
    {:else if error}
        <div class="text-center py-10">
            <p class="text-red-500 text-xl">{error}</p>
            <a
                href="/products"
                class="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded"
                >Back to Products</a
            >
        </div>
    {:else if product}
        <div class="flex flex-col">
			<div class="flex flex-col">
				<span class="font-bold text-2xl">{product.name}</span>
				<span class="text-lg">{product.brand_name}</span>
			</div>
			{#if product.image_url || product.image}
				<div class="mt-4">
					<img 
						src={product.image_url || product.image} 
						alt={product.name} 
						class="w-full max-w-md h-auto rounded-lg object-cover shadow-md"
					/>
				</div>
			{:else}
				<div class="mt-4 bg-gray-200 w-full max-w-md h-64 flex items-center justify-center rounded-lg">
					<p class="text-gray-500">No image available</p>
				</div>
			{/if}
		</div>
		{#if product.product_images && product.product_images.length > 1}
			<div class="mt-8">
				<h3 class="text-xl font-semibold mb-4">Product Gallery</h3>
				<div class="flex overflow-x-auto space-x-4 pb-4">
					{#each product.product_images as image, i}
						<div class="flex-shrink-0">
							<!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
							<img 
								src={image.url} 
								alt={image.alt_text || `${product.name} image ${i+1}`}
								class="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                                onclick={() => { if (product) product.image_url = image.url; }}
							/>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		
		{#if product.specifications}
			<div class="mt-8">
				<ProductSpecifications specifications={product.specifications} />
			</div>
		{/if}
    {/if}
</div>
