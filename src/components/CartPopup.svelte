<script lang="ts">
    import Popup from "./ui/Popup.svelte";
    import Button from "./ui/Button.svelte";
    import { cart } from "../lib/stores/cart";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    const { isOpen, onClose }: Props = $props();

    function increaseQuantity(id: number) {
        $cart = $cart.map((item) =>
            item.id === id
                ? { ...item, quantity: (item.quantity || 1) + 1 }
                : item,
        );
    }

    function decreaseQuantity(id: number) {
        $cart = $cart.map((item) =>
            item.id === id && (item.quantity || 1) > 1
                ? { ...item, quantity: (item.quantity || 1) - 1 }
                : item,
        );
    }

    function emptyCart() {
        $cart = [];
    }

    let totalPrice = $state(0);

    $effect(() => {
        totalPrice = $cart.reduce(
            (total, item) => total + item.price * (item.quantity || 1),
            0,
        );
    });

    function capitalizeFirstLetter(str: string | undefined): string {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
</script>

<Popup title="Winkelwagen" {isOpen} {onClose} titleSeperator={true}>
    {#if $cart.length === 0}
        <p>Je winkelwagen is leeg.</p>
    {:else}
        <div class="flex flex-col gap-4">
            {#each $cart as item (item.id)}
                <div class="flex items-center py-1 px-1 flex-row">
                    <div
                        class="w-16 h-16 bg-gray-100 flex items-center justify-center mr-4 rounded"
                    >
                        {#if item.brandImage}
                            <img
                                src={item.brandImage}
                                alt={item.brand}
                                class="max-w-full max-h-full object-contain"
                            />
                        {:else}
                            [Brand Logo]
                        {/if}
                    </div>
                    <div class="flex-grow font-medium">
                        {capitalizeFirstLetter(item.name)}
                    </div>
                    <div class="flex items-center gap-0.5">
                        <Button
                            variant="icon"
                            onclick={() => decreaseQuantity(item.id)}
                            className="w-7 h-7 rounded-full bg-gray-200 text-center flex items-center justify-center"
                        >
                            <span class="-translate-y-[0.2]">-</span>
                        </Button>
                        <span class="w-6 text-center">{item.quantity || 1}</span
                        >
                        <Button
                            variant="icon"
                            onclick={() => increaseQuantity(item.id)}
                            className="w-7 h-7 rounded-full bg-gray-200 text-center flex items-center justify-center"
                        >
                            <span class="-translate-y-[0.5]">+</span>
                        </Button>
                    </div>
                    <div class="font-medium min-w-20 text-right">
                        €{(item.price * item.quantity).toFixed(2)}
                    </div>
                </div>
            {/each}
        </div>

        <hr class="my-4 border-t border-gray-200" />

        <section aria-label="Cart summary" class="mb-4">
            <div class="flex items-center justify-between gap-2">
                <Button variant="error" onclick={emptyCart} className="w-30">
                    Wissen
                </Button>

                <form class="flex items-center">
                    <label for="discount-code" class="sr-only"
                        >Kortingscode</label
                    >
                    <input
                        id="discount-code"
                        type="text"
                        placeholder="Kortingscode invoeren.."
                        class="p-2 border border-gray-300 rounded w-48 focus:outline-none"
                    />
                </form>

                <output class="text-2xl font-bold" aria-label="Totaal bedrag">
                    €{totalPrice.toFixed(2)}
                </output>
            </div>
        </section>

        <footer>
            <Button
                variant="primary"
                className="w-full py-2 bg-black text-white rounded text-base"
            >
                Afrekenen
            </Button>
        </footer>
    {/if}
</Popup>
