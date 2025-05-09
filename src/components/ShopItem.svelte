<script lang="ts">
    import type { ProductItem } from "$lib/types/supabaseTypes";
    import { capitalizeFirstLetter } from "$lib/utils";
    import Button from "./ui/Button.svelte";
    import { addToCart } from "$lib/stores/cart";

    interface Props {
        product: ProductItem;
        onAddToCart?: () => void;
    }

    function handleAddToCart(e: Event){
        e.preventDefault(); 
        e.stopPropagation(); 
        if (onAddToCart) {
            onAddToCart();
        } else {
            // Default add to cart behavior
            addToCart(product, 1);
        }
    }

    let { product, onAddToCart }: Props = $props();
    
    // For backward compatibility - use product if provided or fall back to item
    const item = product;
</script>

<a href={`/products/${item.id}`}>
    <article
        class="border border-gray-200 rounded-lg overflow-hidden w-3xs flex flex-col bg-white shadow-md pointer-events-auto cursor-pointer"
    >
        <figure class="h-44 flex justify-center items-center p-4 bg-white">
            <img
                src={item.image_url || item.image}
                alt={capitalizeFirstLetter(item.name)}
                class="max-w-full max-h-full object-contain rounded-md"
            />
        </figure>

        <div class="p-3 px-4">
            <header class="flex flex-col gap-0.5">
                <p class="text-lg font-medium text-gray-800">
                    {capitalizeFirstLetter(item.name)}
                </p>
                <h3 class="text-base font-normal text-gray-600">
                    {capitalizeFirstLetter(item.brand_name)}
                </h3>
                {#if item.specifications && item.specifications.length > 0}
                    <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mb-2 inline-block">
                        Specifications available
                    </span>
                {/if}
            </header>

            <footer class="flex justify-between items-center mt-1 z-10">
                <div class="text-lg font-bold text-black w-fit h-fit">
                    €{item.price}
                </div>
                <Button
                    variant="cart-item"
                    onclick={handleAddToCart}
                >
                    <span class="mr-1 text-[10px]" aria-hidden="true">➤</span>
                    <span>Winkelmandje</span>
                </Button>
            </footer>
        </div>
    </article>
</a>
