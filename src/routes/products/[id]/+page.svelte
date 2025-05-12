<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { user } from "$lib/stores/authStore";
    import {
        addToCart,
        getItemQuantity,
        updateQuantityIfInCart,
    } from "$lib/stores/cart";
    import { getShopItemById, loadShopItems } from "$lib/stores/shopItemStore";
    import {
        comparisonStore,
        comparisonCount,
    } from "$lib/stores/comparisonStore";
    import type { ProductItem } from "$lib/types/supabaseTypes";
    import ProductSpecifications from "../../../components/ProductSpecifications.svelte";
    import Button from "../../../components/ui/Button.svelte";

    let product = $state<ProductItem | null>();
    let loading = $state(false);
    let error = $state<string>();
    let quantity = $state(1);
    let relatedProducts = $state<ProductItem[]>([]);
    let currentImageIndex = $state(0);
    let selectedVariant = $state("");
    //TODO: add variants to database
    let variants = $state<string[]>([]);

    let isProductInComparison = $state(false);
    let canAddToComparison = $state(true);

    async function loadProduct() {
        try {
            loading = true;
            const productId = page.params.id;

            product = await getShopItemById(productId);

            if (!product) {
                error = "Product not found";
            } else {
                quantity = getItemQuantity(product?.id);
                if (quantity == 0) quantity = 1;

                await fetchRelatedProducts();
            }
        } catch (err) {
            console.error("Error fetching product:", err);
            error = "Failed to load product";
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        loadProduct();
    });

    $effect(() => {
        if (product?.id) {
            isProductInComparison = comparisonStore.isInComparison(product.id);
            canAddToComparison =
                !comparisonStore.isComparisonFull() || isProductInComparison;
        }
    });

    function handleToggleComparison(item: ProductItem) {
        if (!item) return;

        if (comparisonStore.isInComparison(item.id)) {
            comparisonStore.removeFromComparison(item.id);
            isProductInComparison = false;
        } else {
            const added = comparisonStore.addToComparison(item);
            if (added) {
                isProductInComparison = true;
            }
        }
        canAddToComparison =
            !comparisonStore.isComparisonFull() || isProductInComparison;
    }

    async function fetchRelatedProducts() {
        if (!product) return;

        try {
            const allProducts = await loadShopItems(false);
            relatedProducts = allProducts
                .filter(
                    (item) =>
                        item.id !== product?.id &&
                        (item.brand_name === product?.brand_name ||
                            item.category === product?.category),
                )
                .slice(0, 8);
        } catch (err) {
            console.error("Error fetching related products:", err);
        }
    }

    async function handleAddToCart() {
        if (!product) return;

        if (quantity <= 0) {
            return;
        }

        try {
            if (
                product.id &&
                (await updateQuantityIfInCart(product.id, quantity))
            ) {
                console.log("Item quantity updated in cart");
            } else {
                const productWithVariant = {
                    ...product,
                    variant: selectedVariant || null,
                };

                await addToCart(productWithVariant, quantity);
            }
        } catch (err) {
            console.error("Error adding to cart:", err);
        }
    }

    async function decreaseQuantity() {
        if (quantity > 1) {
            quantity--;

            if (product && product.id && $user) {
                try {
                    await updateQuantityIfInCart(product.id, quantity);
                } catch (err) {
                    console.error("Error updating quantity:", err);
                }
            }
        }
    }

    async function increaseQuantity() {
        quantity++;

        if (product && product.id && $user) {
            try {
                await updateQuantityIfInCart(product.id, quantity);
            } catch (err) {
                console.error("Error updating quantity:", err);
            }
        }
    }

    function changeMainImage(index: number) {
        if (
            product &&
            product.product_images &&
            product.product_images.length > index
        ) {
            currentImageIndex = index;
            product.image_url = product.product_images[index].url;
        }
    }
</script>

{#snippet ErrorMessage(errorText: string)}
    <div class="flex flex-col items-center justify-center py-16 px-4">
        <div class="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
            <div class="flex justify-center mb-4">
                <svg
                    class="w-16 h-16 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    ></path>
                </svg>
            </div>
            <h2 class="text-2xl font-bold text-center text-gray-800 mb-2">
                Product Not Found
            </h2>
            <p class="text-center text-gray-600 mb-6">{errorText}</p>
            <div class="flex justify-center">
                <a
                    href="/products"
                    class="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                    <svg
                        class="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        ></path>
                    </svg>
                    Back to Products
                </a>
            </div>
        </div>
    </div>
{/snippet}

{#snippet ProductGallery(product: ProductItem)}
    <div>
        <div class="mb-4">
            <h1 class="text-2xl font-bold">{product.name}</h1>
            <p class="text-lg text-gray-600">
                {product.brand_name}
            </p>
        </div>

        <!-- Main product image -->
        <div class="mb-4 bg-white rounded-lg p-4 shadow-sm">
            <img
                src={product.image_url || product.image}
                alt={product.name}
                class="w-full h-auto object-contain"
            />
        </div>

        <!-- Product thumbnails -->
        {#if product.product_images && product.product_images.length > 0}
            <div class="flex overflow-x-auto space-x-2 pb-2">
                {#each product.product_images as image, i}
                    <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <img
                        src={image.url}
                        alt={image.alt_text || `${product.name} image ${i + 1}`}
                        class="w-16 h-16 object-cover rounded cursor-pointer
                            {currentImageIndex === i
                            ? 'border-2 border-blue-500'
                            : 'border border-gray-200'}"
                        onclick={() => changeMainImage(i)}
                    />
                {/each}
            </div>
        {/if}
    </div>
{/snippet}

{#snippet Specifications(product: ProductItem)}
    <div class="bg-gray-100 p-4 rounded-lg h-full">
        <h2 class="text-xl font-semibold mb-4">Specificaties</h2>
        {#if product.specifications}
            <ProductSpecifications
                specifications={product.specifications}
                hideHeader
            />
        {:else}
            <p class="text-gray-500">No specifications available</p>
        {/if}

        {#if product.description}
            <div class="mt-4 text-gray-700">
                <p>{product.description}</p>
            </div>
        {/if}
    </div>
{/snippet}

{#snippet PurchasePanel(product: ProductItem)}
    <div class="bg-gray-100 p-4 rounded-lg">
        <!-- Price -->
        <div class="mb-6">
            <p class="text-3xl font-bold">${product.price}</p>
        </div>

        <!-- Variant selection -->
        {#if variants.length > 0}
            <div class="mb-6">
                <div class="relative">
                    <select
                        bind:value={selectedVariant}
                        class="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                    >
                        {#each variants as variant}
                            <option value={variant}>{variant}</option>
                        {/each}
                    </select>
                    <div
                        class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
                    >
                        <svg
                            class="fill-current h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                        >
                            <path
                                d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                            />
                        </svg>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Stock info -->
        <div class="mb-6">
            <p class="text-lg">
                Voorraad: {product.stock || 12}
            </p>
        </div>

        <!-- Quantity selector -->
        <div class="mb-6">
            <p class="text-lg mb-2">Quantity:</p>
            <div class="flex items-center">
                <Button variant="icon" onclick={decreaseQuantity}>
                    <span class="text-xl font-bold px-2">-</span>
                </Button>
                <span class="mx-4 text-xl">{quantity}</span>
                <Button variant="icon" onclick={increaseQuantity}>
                    <span class="text-xl font-bold px-2">+</span>
                </Button>
            </div>
        </div>

        <!-- Compare button -->
        <div class="mb-6">
            <Button
                variant="secondary"
                className="w-full"
                onclick={() => handleToggleComparison(product)}
                disabled={!canAddToComparison && !isProductInComparison}
            >
                {isProductInComparison
                    ? "Remove from Compare"
                    : "Add to Compare"}
            </Button>
        </div>

        <!-- Add to cart button -->
        <div>
            <Button
                variant="primary"
                onclick={handleAddToCart}
                className="w-full py-3 px-6 rounded-lg flex items-center justify-center"
                disabled={!product}
            >
                <svg
                    width="24"
                    height="24"
                    class="mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
                    />
                </svg>
                Add to cart
            </Button>
        </div>
    </div>
{/snippet}

{#snippet RelatedProducts(products: ProductItem[])}
    {#if products.length > 0}
        <div class="mt-16">
            <h2 class="text-2xl font-bold mb-4">Gerelateerde Producten</h2>

            <div
                class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4"
            >
                {#each products as item}
                    <div class="border border-gray-200 rounded p-4">
                        <a href={`/products/${item.id}`} class="block">
                            <div
                                class="h-40 flex items-center justify-center mb-4"
                            >
                                <img
                                    src={item.image_url || item.image}
                                    alt={item.name}
                                    class="max-h-full max-w-full object-contain"
                                />
                            </div>
                            <div class="text-center">
                                <p class="text-sm text-gray-500">
                                    {item.brand_name}
                                </p>
                                <p class="font-medium">{item.name}</p>
                                <p class="font-bold mt-1">
                                    €{item.price}
                                </p>
                            </div>
                        </a>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
{/snippet}

<div class="container mx-auto px-4">
    {#if loading}
        <div class="flex justify-center items-center h-64">
            <p class="text-xl">Loading product...</p>
        </div>
    {:else if error}
        {@render ErrorMessage(error)}
    {:else if product}
        <div class="my-8">
            <!-- Product information layout -->
            <div class="flex flex-col md:flex-row gap-8">
                <!-- Left: Product name, brand and images -->
                <div class="md:w-1/3">
                    {@render ProductGallery(product)}
                </div>

                <!-- Middle: Product specifications  -->
                <div class="md:w-1/3">
                    {@render Specifications(product)}
                </div>

                <!-- Right: Price, variant selection, stock info, purchase options -->
                <div class="md:w-1/3">
                    {@render PurchasePanel(product)}
                </div>
            </div>

            <!-- Related products -->
            {@render RelatedProducts(relatedProducts)}
        </div>
    {/if}
</div>
