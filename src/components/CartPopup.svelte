<script lang="ts">
    import Popup from "./ui/Popup.svelte";
    import Button from "./ui/Button.svelte";
    import Input from "./ui/Input.svelte";
    import { cart } from "../lib/stores/cart";
    import { browser } from "$app/environment";

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
        const updatedCart = $cart.map((item) =>
            item.id === id
                ? { ...item, quantity: (item.quantity || 1) - 1 }
                : item,
        );

        $cart = updatedCart.filter((item) => item.quantity > 0);
    }

    function emptyCart() {
        $cart = [];
    }

    let totalPrice = $state(0);
    let discountCode = $state<string>()

    $effect(() => {
        totalPrice = $cart.reduce(
            (total, item) => total + item.price * (item.quantity || 1),
            0,
        );
    });

    let isSmallScreen: boolean = $state(false);

    $effect(() => {
        if (browser) {
            const handleResize = () => {
                if (window.innerWidth > 640) {
                    isSmallScreen = false;
                } else {
                    isSmallScreen = true;
                }
            };

            window.addEventListener("resize", handleResize);

            handleResize();

            return () => {
                window.removeEventListener("resize", handleResize);
            };
        }
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
                    {#if !isSmallScreen}
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
                                <span>[Brand Logo]</span>
                            {/if}
                        </div>
                    {/if}
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
            <div
                class="flex flex-col sm:flex-row items-center gap-3 sm:justify-between"
            >
                <Button
                    variant="error"
                    onclick={emptyCart}
                    className="w-full sm:w-36"
                >
                    Wissen
                </Button>

                <form class="flex items-center w-full sm:w-auto">
                    <label for="discount-code" class="sr-only">Kortingscode</label>
                    <Input
                        id="discount-code"
                        variant="discount"
                        placeholder="Kortingscode invoeren.."
                        bind:bindValue={discountCode}
                    />
                </form>

                <output
                    class="text-xl sm:text-2xl font-bold mt-2 sm:mt-0"
                    aria-label="Totaal bedrag"
                >
                    {#if isSmallScreen}Totaal:{/if}€{totalPrice.toFixed(2)}
                </output>
            </div>
        </section>

        <footer>
            <Button
                variant="primary"
                className="w-full py-3 sm:py-2 bg-black text-white rounded text-base"
            >
                Afrekenen
            </Button>
        </footer>
    {/if}
</Popup>
