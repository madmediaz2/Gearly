<script lang="ts">
    import { comparisonStore, comparisonCount } from '$lib/stores/comparisonStore';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import type { ProductItem } from '$lib/types/supabaseTypes';
    import Button from './ui/Button.svelte';
    import Popup from './ui/Popup.svelte';
    import { sheetOpenStore } from '$lib/stores/sheetStore';
    
    let expanded = $state(false);
    let comparisonItems = $state<ProductItem[]>([]);
    let isMobileSheetOpen = $state(false);
    let isCompareRoute = $state(false);
    let itemsInComparison = $derived($comparisonCount == 0)
    
    comparisonStore.subscribe((state) => {
        comparisonItems = state.items;
    });
    
    $effect(() => {
        isCompareRoute = $page.url.pathname === '/compare';
        
        if (isCompareRoute && expanded) {
            expanded = false;
        }
    });

    $effect(() => {
        if(itemsInComparison){
            expanded = false;
        }
    })
    
    // Subscribe to sheetOpen state
    sheetOpenStore.subscribe(value => {
        isMobileSheetOpen = value;
        if (value && expanded) {
            expanded = false;
        }
    });
    
    function toggleExpanded() {
        expanded = !expanded;
    }
    
    function goToComparison() {
        goto('/compare');
        expanded = false;
    }
    
    function removeItem(id: number) {
        comparisonStore.removeFromComparison(id);
    }
</script>

{#if $comparisonCount > 0 && !isMobileSheetOpen && !isCompareRoute}
    <div class="fixed bottom-4 right-4 z-50">
        {#if !expanded}
            <Button 
                variant="primary"
                onclick={toggleExpanded}
                className="px-6 rounded-full shadow-lg flex items-center"
            >
                <span class="mr-2">Compare</span>
                <span class="bg-white text-black rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
                    {$comparisonCount}
                </span>
            </Button>
        {/if}
        
        <Popup
            isOpen={expanded}
            title="Comparison List"
            onClose={toggleExpanded}
            position="bottom-right"
        >
            {#if $comparisonCount > 0}
                <div class="flex flex-col items-left text-black">
                    <p class="mb-4">{$comparisonCount} {$comparisonCount === 1 ? 'item' : 'items'} added</p>
                    
                    <div class="w-full mb-4">
                        {#each comparisonItems as item}
                            <div class="flex items-center justify-between py-2 border-b border-gray-200">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center mr-3">
                                        <img src={item.image_url || item.image} alt={item.name} class="max-h-10 max-w-10 object-contain" />
                                    </div>
                                    <div>
                                        <p class="text-sm font-medium">{item.name}</p>
                                        <p class="text-xs text-gray-500">{item.brand_name || ''}</p>
                                    </div>
                                </div>
                                <Button 
                                    variant="icon"
                                    onclick={() => removeItem(item.id)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </Button>
                            </div>
                        {/each}
                    </div>
                    
                    <div class="flex gap-2 w-full">
                        <Button 
                            variant="primary"
                            onclick={goToComparison}
                            className="flex-1" 
                        >
                            View Comparison
                        </Button>
                    </div>
                </div>
            {/if}
        </Popup>
    </div>
{/if}
