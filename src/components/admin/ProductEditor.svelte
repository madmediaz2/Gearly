<script lang="ts">
    import { supabase } from "$lib/supabaseClient";
    import type { ProductItem, ProductImage } from "$lib/types/supabaseTypes";
    import Button from "../ui/Button.svelte";
    import Input from "../ui/Input.svelte";
    import SpecificationsEditor from "./SpecificationsEditor.svelte";
    
    interface Props {
        product: ProductItem;
        isNew: boolean;
        onSave: () => void;
    }
    
    const { product, isNew, onSave }: Props = $props();
    
    let isLoading = $state(false);
    let errorMessage = $state('');
    let successMessage = $state('');
    let brands = $state<{id: number, name: string}[]>([]);
    let selectedBrandId = $state<number | null>(null);
    let imageFiles = $state<FileList | null>(null);
    let formValid = $derived(
        !!product.name && 
        product.price > 0 &&
        product.stock >= 0
    );
    
    $effect(() => {
        loadBrands();
        if (product.brand_name) {
            findBrandIdByName();
        }
    });
    
    async function loadBrands() {
        try {
            const { data, error } = await supabase
                .from('brands')
                .select('id, name')
                .order('name');
                
            if (error) throw error;
            brands = data || [];
        } catch (err: any) {
            console.error('Error loading brands:', err);
            errorMessage = 'Failed to load brands';
        }
    }
    
    async function findBrandIdByName() {
        if (!product.brand_name) return;
        
        try {
            const { data, error } = await supabase
                .from('brands')
                .select('id')
                .eq('name', product.brand_name)
                .single();
                
            if (error && error.code !== 'PGRST116') throw error;
            if (data) selectedBrandId = data.id;
        } catch (err) {
            console.error('Error finding brand ID:', err);
        }
    }
    
    async function saveProduct(e: Event) {
        isLoading = true;
        errorMessage = '';
        successMessage = '';

        e.preventDefault();        
        
        try {
            const productData = {
                name: product.name,
                price: product.price,
                description: product.description,
                sku: product.sku,
                stock: product.stock,
                is_active: true,
                brand_id: selectedBrandId
            };
            
            let savedProduct;
            
            if (isNew) {
                const { data, error } = await supabase
                    .from('products')
                    .insert([productData])
                    .select('id')
                    .single();
                    
                if (error) throw error;
                savedProduct = data;
            } else {
                const { data, error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', product.id)
                    .select('id')
                    .single();
                    
                if (error) throw error;
                savedProduct = data;
            }
            
            if (imageFiles && imageFiles.length > 0) {
                await uploadProductImages(savedProduct.id);
            }
            
            successMessage = `Product ${isNew ? 'created' : 'updated'} successfully!`;
            onSave();  
            
        } catch (err: any) {
            console.error('Error saving product:', err);
            errorMessage = err.message || `Failed to ${isNew ? 'create' : 'update'} product`;
        } finally {
            isLoading = false;
        }
    }
    
    async function uploadProductImages(productId: number) {
        if (!imageFiles || imageFiles.length === 0) return;
        
        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${productId}_${Date.now()}_${i}.${fileExt}`;
            const filePath = `product-images/${fileName}`;
            
            const { error: uploadError } = await supabase
                .storage
                .from('products')
                .upload(filePath, file);
                
            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                continue;
            }
            
            const { data: publicUrl } = supabase
                .storage
                .from('products')
                .getPublicUrl(filePath);
                
            if (!publicUrl) continue;
            
            await supabase
                .from('product_images')
                .insert([{
                    product_id: productId,
                    url: publicUrl.publicUrl,
                    alt_text: product.name,
                    position: i
                }]);
        }
    }
    
    async function deleteImage(imageId: number) {
        if (!confirm('Are you sure you want to delete this image?')) return;
        
        isLoading = true;
        
        try {
            const { data: imageData, error: fetchError } = await supabase
                .from('product_images')
                .select('url')
                .eq('id', imageId)
                .single();
                
            if (fetchError) throw fetchError;
            
            const { error: deleteError } = await supabase
                .from('product_images')
                .delete()
                .eq('id', imageId);
                
            if (deleteError) throw deleteError;
            
            if (imageData?.url) {
                try {
                    const storageUrl = new URL(imageData.url);
                    const pathParts = storageUrl.pathname.split('/');
                    const storagePath = pathParts.slice(2).join('/');
                    
                    if (storagePath) {
                        await supabase
                            .storage
                            .from('products')
                            .remove([storagePath]);
                    }
                } catch (err) {
                    console.warn('Could not parse storage URL or delete file:', err);
                }
            }
            
            if (product.product_images) {
                product.product_images = product.product_images.filter(img => img.id !== imageId);
            }
            
            successMessage = 'Image deleted successfully';
        } catch (err: any) {
            console.error('Error deleting image:', err);
            errorMessage = err.message || 'Failed to delete image';
        } finally {
            isLoading = false;
        }
    }
    
    async function deleteProduct() {
        if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;
        
        isLoading = true;
        
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_active: false })
                .eq('id', product.id);
                
            if (error) throw error;
            
            successMessage = 'Product deleted successfully';
            onSave();
        } catch (err: any) {
            console.error('Error deleting product:', err);
            errorMessage = err.message || 'Failed to delete product';
        } finally {
            isLoading = false;
        }
    }
</script>

<form onsubmit={saveProduct} class="space-y-6">
    <!-- Action Buttons -->
    <div class="flex justify-between mb-4">
        <div>
            {#if !isNew}
                <Button
                    variant="error"
                    onclick={deleteProduct}
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
                {isLoading ? 'Saving...' : isNew ? 'Create Product' : 'Update Product'}
            </Button>
        </div>
    </div>
    
    {#if errorMessage}
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{errorMessage}</p>
        </div>
    {/if}
    
    {#if successMessage}
        <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
            <p>{successMessage}</p>
        </div>
    {/if}
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Basic Info Section -->
        <div class="space-y-4">
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
                <label for="product-brand" class="block text-sm font-medium text-gray-700 mb-1">
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
        </div>
        
        <!-- Description and Images Section -->
        <div class="space-y-4">
            <div>
                <label for="product-description" class="block text-sm font-medium text-gray-700 mb-1">
                    Description
                </label>
                <textarea
                    id="product-description"
                    rows="4"
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
                    accept="image/*"
                    multiple
                    bind:files={imageFiles}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                />
                <p class="text-xs text-gray-500 mt-1">
                    Upload one or more images for this product
                </p>
            </div>
            
            <!-- Existing Images Gallery -->
            {#if product.product_images && product.product_images.length > 0}
                <div class="mt-4">
                    <h3 class="text-sm font-medium text-gray-700 mb-2">Current Images</h3>
                    <div class="grid grid-cols-2 gap-2">
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
                                    onclick={() => deleteImage(image.id)}
                                    disabled={isLoading}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </Button>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </div>
    
    {#if !isNew && product.id}
        <!-- Specifications Editor - only show for existing products -->
        <div class="mb-6">
            <SpecificationsEditor productId={product.id} />
        </div>
    {/if}
</form>
