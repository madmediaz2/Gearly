<script lang="ts">
    import { fly } from "svelte/transition";
    import AuthPopup from "./AuthPopup.svelte";
    import { logout, user } from "$lib/stores/authStore";
    import AccountPopup from "./AccountPopup.svelte";
    import { type PopupControls } from "$lib/types/popupTypes";
    import CartPopup from "./CartPopup.svelte";
    import Button from "./ui/Button.svelte";

    interface Props {
        sheetOpen: boolean;
        toggleSheet: () => void;
        popupControls: PopupControls;
        onLogout: () => void;
        categories: Array<{ id: number, name: string, slug: string }>;
        isLoading: boolean;
        error: string | null;
    }

    const { sheetOpen, toggleSheet, popupControls, onLogout, categories, isLoading, error }: Props = $props();
</script>

{#if sheetOpen}
    <div
        class="fixed inset-0 z-50 overflow-hidden"
        transition:fly={{ x: -100, duration: 200 }}
    >
        <!-- Overlay --><!-- svelte-ignore a11y_no_static_element_interactions --><!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            class="absolute inset-0 opacity-100 blur-3xl bg-gray-100 transition-opacity"
            onclick={toggleSheet}
        ></div>

        <!-- Sheet Panel -->
        <div
            class="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
        >
            <div class="flex flex-col h-full">
                <!-- Header -->
                <div
                    class="px-4 py-6 flex items-center justify-between border-b border-gray-200"
                >
                    <div class="flex items-center">
                        <img
                            src="/gearly_logo.svg"
                            alt="Gearly"
                            class="w-10 h-10"
                        />
                        <span class="ml-2 text-xl font-medium">Gearly</span>
                    </div>
                    <Button
                        variant="icon"
                        className="rounded-md text-gray-500 hover:bg-gray-100 p-2"
                        onclick={toggleSheet}
                    >
                        <svg
                            class="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
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
                <!-- Navigation Links -->
                <nav class="py-2 px-4 grow">
                    <Button variant="mobile-nav">
                        <img src="/menu.svg" alt="menu" class="mr-2" />
                        <span>Categorieen</span>
                    </Button>
                    
                    <!-- Dynamic categories loaded from database -->
                    {#if isLoading}
                        <div class="py-2 text-gray-400">Loading categories...</div>
                    {:else if error}
                        <div class="py-2 text-red-500">Error: {error}</div>
                    {:else}
                        {#each categories as category}
                            <Button variant="mobile-nav">
                                <a href={`/categories/${category.slug}`} class="w-full text-left">
                                    <span>{category.name}</span>
                                </a>
                            </Button>
                        {/each}
                    {/if}
                </nav>
                <!-- User Actions -->
                <div class="border-t border-gray-200 py-4 px-4 mt-auto">
                    <Button
                        variant="mobile-nav"
                        onclick={popupControls.toggleCartPopUp}
                    >
                        <img
                            src="/shopping_cart.svg"
                            alt="Shopping Cart"
                            class="w-6 h-6 mr-2"
                        />
                        <span>Winkelwagen</span>
                    </Button>
                    <CartPopup
                        isOpen={popupControls.cartPopupOpen}
                        onClose={popupControls.closeCartPopUp}
                    />

                    {#if !$user}
                        <Button
                            variant="mobile-nav"
                            onclick={popupControls.toggleAuthPopup}
                        >
                            <img
                                src="/avatar.svg"
                                alt="Account Centrum"
                                class="w-6 h-6 mr-2"
                            />
                            <span>Inloggen</span>
                        </Button>
                        <AuthPopup
                            isOpen={popupControls.authPopupOpen}
                            onClose={popupControls.closeAuthPopup}
                        />
                    {:else}
                        <Button
                            variant="mobile-nav"
                            onclick={popupControls.toggleAccountPopUp}
                        >
                            <img
                                src="/avatar.svg"
                                alt="Account Centrum"
                                class="w-6 h-6 mr-2"
                            />
                            <span>Account Centrum</span>
                        </Button>
                        <AccountPopup
                            isOpen={popupControls.accountPopUpOpen}
                            onClose={popupControls.closeAccountPopUp}
                            {onLogout}
                        />
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}
