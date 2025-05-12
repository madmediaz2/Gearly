<script lang="ts">
    import type { ProductItem } from "$lib/types/supabaseTypes";
    import {
        deleteProduct,
        deleteProductImage,
        findBrandIdByName,
        loadBrands,
        saveProduct,
        uploadProductImages,
        loadCategories,
        getProductCategory,
        updateProductCategory,
    } from "$lib/api/supabaseApi";
    import Button from "../ui/Button.svelte";
    import Input from "../ui/Input.svelte";
    import SpecificationsEditor from "./SpecificationsEditor.svelte";
    import NotificationMessage from "../ui/NotificationMessage.svelte";

    interface Props {
        product: ProductItem;
        isNew: boolean;
        onSave: () => void;
    }

    const { product, isNew, onSave }: Props = $props();

    let isLoading = $state(false);
    let errorMessage = $state("");
    let successMessage = $state("");
    let brands = $state<{ id: number; name: string }[]>([]);
    let categories = $state<{ id: number; name: string }[]>([]);
    let selectedBrandId = $state<number | null>(null);
    let selectedCategoryId = $state<number | null>(null);
    let imageFiles = $state<FileList | null>(null);
    let isUploadingImages = $state(false);
    let formValid = $derived(
        !!product.name && product.price > 0 && product.stock >= 0,
    );

    $effect(() => {
        loadBrandsData();
        loadCategoriesData();

        if (product.brand_name) {
            findBrandId();
        }

        if (!isNew && product.id) {
            findProductCategory();
        }
    });

    async function loadBrandsData() {
        try {
            brands = await loadBrands();
        } catch (err: any) {
            console.error("Error loading brands:", err);
            errorMessage = "Failed to load brands";
        }
    }

    async function loadCategoriesData() {
        try {
            categories = await loadCategories();
        } catch (err: any) {
            console.error("Error loading categories:", err);
            errorMessage = "Failed to load categories";
        }
    }

    async function findBrandId() {
        if (!product.brand_name) return;

        try {
            const brandId = await findBrandIdByName(product.brand_name);
            if (brandId !== null) selectedBrandId = brandId;
        } catch (err) {
            console.error("Error finding brand ID:", err);
        }
    }

    async function findProductCategory() {
        try {
            const category = await getProductCategory(product.id);
            
            if (category) {
                selectedCategoryId = category.id;
            } else if (product.category) {
                const matchingCategory = categories.find(
                    c => c.name.toLowerCase() === product.category?.toLowerCase()
                );
                
                    selectedCategoryId = matchingCategory?.id || null;

            }
        } catch (err) {
            console.error("Error finding product category:", err);
        }
    }

    async function saveProductHandler(e: Event) {
        isLoading = true;
        errorMessage = "";
        successMessage = "";

        e.preventDefault();

        try {
            // Save the product data
            const savedProduct = await saveProduct(
                product,
                isNew,
                selectedBrandId,
            );

            // Handle image uploads if any
            if (imageFiles && imageFiles.length > 0) {
                isUploadingImages = true;
                
                try {
                    const uploadResult = await uploadProductImages(
                        savedProduct.id,
                        imageFiles,
                        product.name,
                    );
                    
                    // Reset file input after upload is complete
                    imageFiles = null;
                    
                    // Show any upload errors
                    if (uploadResult.errors.length > 0) {
                        // Show the errors but don't fail the whole operation
                        errorMessage = `Product saved but encountered issues with ${uploadResult.errors.length} image(s): ${uploadResult.errors.join("; ")}`;
                    }
                } finally {
                    isUploadingImages = false;
                }
            }

            if (selectedCategoryId) {
                await updateProductCategory(
                    savedProduct.id,
                    selectedCategoryId,
                );
            }

            successMessage = `Product ${isNew ? "created" : "updated"} successfully!`;
            onSave();
        } catch (err: any) {
            console.error("Error saving product:", err);
            errorMessage =
                err.message ||
                `Failed to ${isNew ? "create" : "update"} product`;
        } finally {
            isLoading = false;
        }
    }

    async function deleteImageHandler(imageId: number) {
        if (!confirm("Are you sure you want to delete this image?")) return;

        isLoading = true;

        try {
            await deleteProductImage(imageId);

            if (product.product_images) {
                product.product_images = product.product_images.filter(
                    (img) => img.id !== imageId,
                );
            }

            successMessage = "Image deleted successfully";
        } catch (err: any) {
            console.error("Error deleting image:", err);
            errorMessage = err.message || "Failed to delete image";
        } finally {
            isLoading = false;
        }
    }

    async function deleteProductHandler() {
        if (!confirm(`Are you sure you want to delete "${product.name}"?`))
            return;

        isLoading = true;

        try {
            await deleteProduct(product.id);

            successMessage = "Product deleted successfully";
            onSave();
        } catch (err: any) {
            console.error("Error deleting product:", err);
            errorMessage = err.message || "Failed to delete product";
        } finally {
            isLoading = false;
        }
    }

    function getCurrentCategoryDisplay(): string {
        if (selectedCategoryId) {
            const category = categories.find(c => c.id === selectedCategoryId);
            if (category) return category.name;
        }
        
        if (product.category) {
            return product.category;
        }
        
        return 'None';
    }
</script>

{#snippet ActionButtons()}
    <div>
        {#if !isNew}
            <Button
                variant="error"
                onclick={deleteProductHandler}
                disabled={isLoading}
                type="button"
            >
                Delete
            </Button>
        {/if}
    </div>

    <div class="flex space-x-2">
        <Button
            variant="primary"
            type="submit"
            disabled={isLoading || !formValid}
        >
            {isLoading
                ? "Saving..."
                : isNew
                  ? "Create Product"
                  : "Update Product"}
        </Button>
    </div>
{/snippet}

{#snippet BasicInfoSection()}
    <div>
        <Input
            id="product-name"
            label="Product Name"
            type="text"
            variant="text"
            required
            bind:bindValue={product.name}
        />
    </div>

    <div>
        <Input
            id="product-price"
            label="Price (€)"
            type="number"
            variant="text"
            required
            step="0.01"
            min="0"
            bind:bindValue={product.price}
        />
    </div>

    <div>
        <Input
            id="product-stock"
            label="Stock Quantity"
            type="number"
            variant="text"
            required
            bind:bindValue={product.stock}
        />
    </div>

    <div>
        <Input
            id="product-sku"
            label="SKU (Stock Keeping Unit)"
            type="text"
            variant="text"
            bind:bindValue={product.sku}
        />
    </div>

    <div>
        <label
            for="product-brand"
            class="block text-sm font-medium text-gray-700 mb-1"
        >
            Brand
        </label>
        <select
            id="product-brand"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
            bind:value={selectedBrandId}
        >
            <option value={null}>No Brand</option>
            {#each brands as brand}
                <option value={brand.id}>{brand.name}</option>
            {/each}
        </select>
    </div>

    <div>
        <label
            for="product-category"
            class="block text-sm font-medium text-gray-700 mb-1"
        >
            Category {!isNew ? `(Current: ${getCurrentCategoryDisplay()})` : ''}
        </label>
        <select
            id="product-category"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
            bind:value={selectedCategoryId}
        >
            <option value={null}>No Category</option>
            {#each categories as category}
                <option value={category.id} selected={product.category === category.name || selectedCategoryId === category.id}>
                    {category.name}
                </option>
            {/each}
        </select>
        {#if product.category && !selectedCategoryId && categories.length > 0}
            <p class="text-xs text-amber-600 mt-1">
                Current category "{product.category}" does not match any available category.
            </p>
        {/if}
    </div>
{/snippet}

{#snippet DescriptionImagesSection()}
    <div>
        <label
            for="product-description"
            class="block text-sm font-medium text-gray-700 mb-1"
        >
            Description
        </label>
        <textarea
            id="product-description"
            rows="14"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
            bind:value={product.description}
        ></textarea>
    </div>

    <div>
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="block text-sm font-medium text-gray-700 mb-1">
            Product Images
        </label>
        <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            bind:files={imageFiles}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
            disabled={isLoading || isUploadingImages}
        />
        <p class="text-xs text-gray-500 mt-1">
            Upload one or more images for this product (max 5MB each, formats: JPEG, PNG, WebP, GIF)
        </p>
        
        {#if isUploadingImages}
            <div class="mt-2 flex items-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                <p class="text-sm">Uploading images...</p>
            </div>
        {/if}
        
        {#if imageFiles && imageFiles.length > 0}
            <div class="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                {#each Array.from(imageFiles) as file, i}
                    <div class="relative group">
                        <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${i + 1}`}
                            class="w-full h-24 object-cover rounded-md"
                        />
                        <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p class="text-white text-xs px-1 truncate max-w-full">{file.name}</p>
                        </div>
                    </div>
                {/each}
            </div>
            <button 
                type="button" 
                class="mt-2 text-sm text-red-600 hover:text-red-800"
                onclick={() => { imageFiles = null; }}
            >
                Clear selected images
            </button>
        {/if}
    </div>

    <!-- Existing Images Gallery -->
    {#if product.product_images && product.product_images.length > 0}
        <div class="mt-4">
            <h3 class="text-sm font-medium text-gray-700 mb-2">
                Current Images
            </h3>

            <div class="mt-4 mb-2">
                <h3 class="text-sm font-medium text-gray-700 mb-2">
                    Manage Images
                </h3>
            </div>
            
            <div class="mt-2 grid grid-cols-2 gap-2">
                {#each product.product_images as image}
                    <div class="relative group">
                        <img
                            src={image.url}
                            alt={image.alt_text || product.name}
                            class="w-full h-24 object-cover rounded-md"
                        />
                        <Button
                            variant="error"
                            type="button"
                            className="absolute top-1 right-1 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                            onclick={() => deleteImageHandler(image.id)}
                            disabled={isLoading}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                class="w-4 h-4"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </Button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
{/snippet}

<form onsubmit={saveProductHandler} class="space-y-6">
    <div class="flex justify-between mb-4">
        {@render ActionButtons()}
    </div>
    <NotificationMessage message={errorMessage} type="error" />
    <NotificationMessage message={successMessage} type="success" />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-4">
            <!-- Basic Info Section -->
            {@render BasicInfoSection()}
        </div>

        <!-- Description and Images Section -->
        <div class="space-y-4">
            {@render DescriptionImagesSection()}
        </div>
    </div>

    {#if !isNew && product.id}
        <div class="mb-6">
            <SpecificationsEditor productId={product.id} />
        </div>
    {/if}
</form>
