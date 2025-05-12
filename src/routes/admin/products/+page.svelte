<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import type { ProductItem } from "$lib/types/supabaseTypes";
    import { loadShopItems } from "$lib/stores/shopItemStore";
    import Button from "../../../components/ui/Button.svelte";
    import ProductEditor from "../../../components/admin/ProductEditor.svelte";
    import BrandManager from "../../../components/admin/BrandManager.svelte";
    import CategoryManager from "../../../components/admin/CategoryManager.svelte";
    import AttributeManager from "../../../components/admin/AttributeManager.svelte";

    const userData = $page.data.user;

    let products = $state<ProductItem[]>([]);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let selectedProduct = $state<ProductItem | null>(null);
    let isCreating = $state(false);

    type Tab =
        | "product"
        | "specifications"
        | "brand"
        | "category"
        | "attributes";
    let activeTab = $state<Tab>("product");

    function switchTab(tab: Tab) {
        if (tab === "specifications" && (!selectedProduct || isCreating)) {
            return;
        }
        activeTab = tab;
    }

    onMount(async () => {
        await loadProducts(false);
    });

    async function loadProducts(onMount: boolean = true) {
        isLoading = true;
        error = null;
        try {
            products = await loadShopItems(onMount);
        } catch (err: any) {
            error = err.message || "Failed to load products";
        } finally {
            isLoading = false;
        }
    }

    function selectProduct(product: ProductItem) {
        selectedProduct = { ...product };
        isCreating = false;
        activeTab = "product";
    }

    function startCreatingProduct() {
        selectedProduct = {
            id: 0,
            name: "",
            price: 0,
            quantity: 1,
            brand_name: null,
            brand_image: null,
            image_url: null,
            image: "",
            description: "",
            sku: "",
            stock: 0,
            variant: null,
            product_images: [],
        };
        isCreating = true;
        activeTab = "product";
    }
</script>

{#snippet ProductsList()}
    <div class="w-full md:w-1/3 bg-white p-4 rounded-lg shadow-md">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Products</h2>
            <Button variant="primary" onclick={startCreatingProduct}>
                Add New Product
            </Button>
        </div>
        {#if isLoading}
            <div class="flex justify-center items-center py-10">
                <div
                    class="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"
                ></div>
            </div>
        {:else if error}
            <div class="bg-red-100 text-red-700 p-4 rounded-md">
                <p>{error}</p>
            </div>
        {:else if products.length === 0}
            <div class="text-center py-10">
                <p>No products found.</p>
            </div>
        {:else}
            <div class="overflow-y-auto max-h-[calc(100vh-240px)]">
                <ul class="divide-y divide-gray-200">
                    {#each products as product (product.id)}
                        <!-- svelte-ignore a11y_click_events_have_key_events --><!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                        <li
                            class="py-3 px-2 hover:bg-gray-100 cursor-pointer {selectedProduct?.id ===
                            product.id
                                ? 'bg-gray-100'
                                : ''}"
                            onclick={() => selectProduct(product)}
                        >
                            <div class="flex items-center space-x-3">
                                {#if product.image_url}
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        class="w-12 h-12 object-cover rounded"
                                    />
                                {/if}
                                <div>
                                    <p class="font-medium">{product.name}</p>
                                    <p class="text-sm text-gray-500">
                                        €{product.price} - Stock: {product.stock}
                                    </p>
                                </div>
                            </div>
                        </li>
                    {/each}
                </ul>
            </div>
        {/if}
    </div>
{/snippet}

{#snippet TabNavigation()}
    <div class="flex border-b border-gray-200 mb-4">
        <Button
            variant="tab"
            className={activeTab === "product"
                ? "border-b-2 border-blue-500 font-medium"
                : ""}
            onclick={() => switchTab("product")}
        >
            {isCreating
                ? "Add New Product"
                : selectedProduct
                  ? "Edit Product"
                  : "Products"}
        </Button>
        <Button
            variant="tab"
            className={activeTab === "brand"
                ? "border-b-2 border-blue-500 font-medium"
                : ""}
            onclick={() => switchTab("brand")}
        >
            Brands
        </Button>
        <Button
            variant="tab"
            className={activeTab === "category"
                ? "border-b-2 border-blue-500 font-medium"
                : ""}
            onclick={() => switchTab("category")}
        >
            Categories
        </Button>
        <Button
            variant="tab"
            className={activeTab === "attributes"
                ? "border-b-2 border-blue-500 font-medium"
                : ""}
            onclick={() => switchTab("attributes")}
        >
            Attributes
        </Button>
    </div>
{/snippet}

{#snippet TabContent()}
    {#if activeTab === "product"}
        {#if selectedProduct}
            <h2 class="text-xl font-semibold mb-4">
                {isCreating ? "Add New Product" : "Edit Product"}
            </h2>
            <ProductEditor
                product={selectedProduct}
                isNew={isCreating}
                onSave={() => loadProducts()}
            />
        {:else}
            <div
                class="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-md"
            >
                <p class="text-gray-500">
                    Select a product to edit or click "Add New Product"
                </p>
            </div>
        {/if}
    {:else if activeTab === "brand"}
        <div>
            <BrandManager />
        </div>
    {:else if activeTab === "category"}
        <div>
            <CategoryManager />
        </div>
    {:else if activeTab === "attributes"}
        <div>
            <AttributeManager />
        </div>
    {/if}
{/snippet}

<div class="container mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Product Management</h1>
        <div class="text-gray-600">
            Admin: {userData?.email || "Admin User"}
        </div>
    </div>
    <div class="flex flex-col md:flex-row gap-6">
        <!-- Left side: List of products -->
        {@render ProductsList()}

        <!-- Right side: Tabbed interface -->
        <div class="w-full md:w-2/3">
            <!-- Tab navigation -->
            {@render TabNavigation()}

            <!-- Tab content -->
            <div class="bg-white p-6 rounded-lg shadow-md">
                {@render TabContent()}
            </div>
        </div>
    </div>
</div>
