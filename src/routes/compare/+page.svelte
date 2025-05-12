<script lang="ts">
    import { comparisonStore } from "$lib/stores/comparisonStore";
    import type { ProductItem } from "$lib/types/supabaseTypes";
    import Button from "../../components/ui/Button.svelte";
    import { onMount } from "svelte";
    import { getProductSpecificationsWithAttributes } from "$lib/stores/specificationAttributeStore";
    
    let comparisonItems = $state<ProductItem[]>([]);
    
    let productSpecifications = $state<Record<number, Array<{attribute: any, value: string}>>>({});
    let commonAttributes = $state<Array<{name: string, key: string}>>([]);
    let isLoadingSpecs = $state(false);
    
    onMount(() => {
        const unsubscribe = comparisonStore.subscribe((state) => {
            comparisonItems = state.items;
            if (comparisonItems.length > 0) {
                loadSpecifications();
            }
        });
        
        return () => {
            unsubscribe();
        };
    });
    
    function removeFromComparison(productId: number | undefined) {
        if (!productId) return;
        comparisonStore.removeFromComparison(productId);
    }
    
    function clearComparison() {
        comparisonStore.clearComparison();
    }
    
    async function loadSpecifications() {
        if (comparisonItems.length === 0) return;
        
        isLoadingSpecs = true;
        const specsMap: Record<number, Array<{attribute: any, value: string}>> = {};
        const attributeSet = new Set<string>();
        
        try {
            for (const product of comparisonItems) {
                if (!product.id) continue;
                
                const specs = await getProductSpecificationsWithAttributes(product.id);
                specsMap[product.id] = specs;
                
                specs.forEach((spec: {attribute: any, value: string}) => {
                    attributeSet.add(spec.attribute.name);
                });
            }
            
            productSpecifications = specsMap;
            commonAttributes = Array.from(attributeSet).map(name => ({
                name,
                key: name.toLowerCase().replace(/\s+/g, '_')
            }));
            
        } catch (err) {
            console.error("Error loading specifications:", err);
        } finally {
            isLoadingSpecs = false;
        }
    }
</script>

{#snippet EmptyComparisonState()}
    <div class="bg-white shadow-lg rounded-lg p-10 text-center max-w-2xl mx-auto border border-gray-100">
        <div class="mb-6 text-gray-400 text-6xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="inline-block">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        </div>
        <h2 class="text-2xl font-bold mb-4">No Products to Compare</h2>
        <p class="text-gray-600 mb-6">You haven't added any products to your comparison list yet.</p>
        <Button 
            variant="primary" 
            onclick={() => window.location.href = '/'}
        >
            Browse Products
        </Button>
    </div>
{/snippet}

{#snippet ComparisonSummary()}
    <div class="mb-6 flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            </div>
            <p class="text-lg font-medium text-gray-700">
                Comparing {comparisonItems.length} {comparisonItems.length === 1 ? 'product' : 'products'}
            </p>
        </div>
        <Button variant="secondary" onclick={clearComparison}>Clear All</Button>
    </div>
{/snippet}

{#snippet TableHeader()}
    <tr>
        <th class="py-4 px-6 border-b border-r border-gray-200 bg-gray-100 text-left font-bold">Feature</th>
        {#each comparisonItems as item}
            <th class="py-4 px-6 border-b border-r border-gray-200 bg-gray-100">
                <div class="flex flex-col items-center">
                    <div class="w-32 h-32 bg-white rounded-lg shadow-md p-2 mb-3 flex items-center justify-center">
                        <img 
                            src={item.image_url || item.image} 
                            alt={item.name} 
                            class="max-w-full max-h-full object-contain"
                        />
                    </div>
                    <span class="font-bold text-lg">{item.name}</span>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="mt-2" 
                        onclick={() => removeFromComparison(item.id)}
                    >
                        Remove
                    </Button>
                </div>
            </th>
        {/each}
    </tr>
{/snippet}

{#snippet ComparisonPropertyRow(property: string, valueGetter: (item: ProductItem) => string | number | null | undefined, isBold = false)}
    <tr>
        <td class="py-4 px-6 border-b border-r border-gray-200 font-medium">{property}</td>
        {#each comparisonItems as item}
            <td class="py-4 px-6 border-b border-r border-gray-200 text-center">
                {#if isBold}
                    <div class="text-lg font-bold">{valueGetter(item)}</div>
                {:else}
                    <div class="font-medium">{valueGetter(item)}</div>
                {/if}
            </td>
        {/each}
    </tr>
{/snippet}

{#snippet ActionRow()}
    <tr>
        <td class="py-4 px-6 border-b border-r border-gray-200 font-medium bg-gray-50">Actions</td>
        {#each comparisonItems as item}
            <td class="py-4 px-6 border-b border-r border-gray-200 text-center bg-gray-50">
                <div class="flex flex-col gap-2">
                    <Button 
                        variant="primary" 
                        onclick={() => window.location.href = `/products/${item.id}`}
                    >
                        View Details
                    </Button>
                </div>
            </td>
        {/each}
    </tr>
{/snippet}

{#snippet AttributeRow(attributeName: any, isAlternateRow = false)}
    <tr class={isAlternateRow ? 'bg-gray-50' : ''}>
        <td class="py-4 px-6 border-b border-r border-gray-200 font-medium">{attributeName}</td>
        {#each comparisonItems as item}
            <td class="py-4 px-6 border-b border-r border-gray-200 text-center">
                {#if item.id && productSpecifications[item.id]}
                    {#if productSpecifications[item.id].find(spec => spec.attribute.name === attributeName)}
                        <div>
                            {#if productSpecifications[item.id].find(spec => spec.attribute.name === attributeName)?.attribute.unit}
                                <span class="font-medium ">{productSpecifications[item.id].find(spec => spec.attribute.name === attributeName)?.value}</span> 
                                <span class="text-xs text-gray-500">{productSpecifications[item.id].find(spec => spec.attribute.name === attributeName)?.attribute.unit}</span>
                            {:else}
                                <span class="font-medium ">{productSpecifications[item.id].find(spec => spec.attribute.name === attributeName)?.value}</span>
                            {/if}
                        </div>
                    {:else}
                        <span class="text-gray-400">-</span>
                    {/if}
                {:else}
                    <span class="text-gray-400">-</span>
                {/if}
            </td>
        {/each}
    </tr>
{/snippet}

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Product Comparison</h1>
    
    {#if comparisonItems.length === 0}
        {@render EmptyComparisonState()}
    {:else}
        {@render ComparisonSummary()}
        
        <div class="overflow-x-auto rounded-lg shadow-lg border border-gray-100">
            <table class="min-w-full bg-white">
                <thead>
                    {@render TableHeader()}
                </thead>
                
                <tbody>
                    {@render ComparisonPropertyRow("Price", (item) => `€${item.price}`, true)}
                    
                    {@render ComparisonPropertyRow("Brand", (item) => item.brand_name)}
                    
                    {@render ComparisonPropertyRow("Category", (item) => item.category)}
                    
                    {@render ComparisonPropertyRow("Stock", (item) => item.stock || 'Available')}
                    
                    {@render ActionRow()}
                    
                    {#if commonAttributes.length > 0}
                        <tr>
                            <td colspan={comparisonItems.length + 1} class="py-3 px-6 bg-gray-100 font-bold text-lg border-t border-b border-gray-200">
                                Specifications
                            </td>
                        </tr>
                        {#each commonAttributes as attribute, i}
                            {@render AttributeRow(attribute.name, i % 2 === 0)}
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>
    {/if}
</div>
