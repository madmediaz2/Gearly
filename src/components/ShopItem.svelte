<script lang="ts">
    import Button from "./ui/Button.svelte";
    import type { CartItem } from "$lib/stores/cart";

    interface Props {
        cartItem: Partial<CartItem>;
        onAddToCart: () => void;
    }

    function capitalizeFirstLetter(str: string | undefined): string {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    let { cartItem, onAddToCart }: Props = $props();
</script>

<article
    class="border border-gray-200 rounded-lg overflow-hidden w-3xs flex flex-col bg-white shadow-md"
>
    <figure class="h-44 flex justify-center items-center p-4 bg-white">
        <img
            src={cartItem.image}
            alt={capitalizeFirstLetter(cartItem.name)}
            class="max-w-full max-h-full object-contain"
        />
    </figure>

    <div class="p-3 px-4">
        <header class="flex flex-col gap-0.5">
            <p class="text-lg font-medium text-gray-800">{capitalizeFirstLetter(cartItem.name)}</p>
            <h3 class="text-base font-normal text-gray-600 mb-3">
                {capitalizeFirstLetter(cartItem.brand)}
            </h3>
        </header>

        <footer class="flex justify-between items-center mt-1">
            <div class="text-lg font-bold text-black">€{cartItem.price}</div>
            <Button variant="cart-item" onclick={onAddToCart}>
                <span class="mr-1 text-[10px]" aria-hidden="true">➤</span>
                <span>Winkelmandje</span>
            </Button>
        </footer>
    </div>
</article>
