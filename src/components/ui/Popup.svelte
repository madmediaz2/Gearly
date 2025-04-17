<script lang="ts">
    import { browser } from "$app/environment";
    import { fly } from "svelte/transition";
    import { type Snippet } from "svelte";


    interface Props {
        children: Snippet ;
        title: string;
        isOpen: boolean;
        onClose: () => void;
        errorMessage?: string;
    }

    const { children, title, isOpen, onClose, errorMessage }: Props = $props();

    let isSmallScreen: boolean = $state(false);
    let isLoading: boolean = $state(false);

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

    $effect(() => {
        if (browser && isOpen) {
            const handleEscKey = (event: KeyboardEvent) => {
                if (event.key === "Escape") {
                    onClose();
                }
            };

            window.addEventListener("keydown", handleEscKey);

            return () => {
                window.removeEventListener("keydown", handleEscKey);
            };
        }
    });
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-51 overflow-hidden"
        transition:fly={{ y: isSmallScreen ? 20 : -20, duration: 200 }}
    >
        <!-- Overlay --><!-- svelte-ignore a11y_no_static_element_interactions --><!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
            class="absolute inset-0 opacity-60 blur-sm sm:opacity-100 sm:blur-3xl bg-gray-100 transition-opacity"
            onclick={onClose}
        ></div>

        <!-- Popup Content -->
        <div
            class="fixed bottom-0 sm:absolute sm:bottom-auto sm:top-20 right-0 sm:right-8 w-full max-w-md bg-white rounded-lg shadow-lg transform transition-all"
        >
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold">
                        {title}
                    </h2>
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button
                        class="text-gray-500 hover:text-gray-700 pointer-events-auto cursor-pointer"
                        onclick={onClose}
                        disabled={isLoading}
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
                    </button>
                </div>
                {#if errorMessage}
                    <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {errorMessage}
                    </div>
                {/if}
                {@render children()}
            </div>
        </div>
    </div>
{/if}
