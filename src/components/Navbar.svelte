<script lang="ts">
    import { browser } from "$app/environment";
    import AuthPopup from "./AuthPopup.svelte";
    import MobileSheet from "./MobileSheet.svelte";
    import SearchBar from "./SearchBar.svelte";
    import { user, logout, getToken, getRefreshToken } from "$lib/stores/authStore";
    import AccountPopup from "./AccountPopup.svelte";
    import CartPopup from "./CartPopup.svelte";
    import { type PopupControls } from "$lib/types/popupTypes";
    import Button from "./ui/Button.svelte";
    import { onMount } from "svelte";
    import { isAdmin } from "$lib/stores/authStore";
    import { 
        categories as categoriesStore, 
        isCategoriesLoading, 
        categoriesError,
        loadAllCategories 
    } from "$lib/stores/categoryStore";
    import type { Category } from "$lib/stores/categoryStore";
    import { sheetOpenStore } from '$lib/stores/sheetStore';

    let searchQuery = $state("");
    let sheetOpen = $state(false);
    let authPopupOpen = $state(false);
    let accountPopUpOpen = $state(false);
    let cartPopupOpen = $state(false);
    let categories = $state<Category[]>([]);
    
    // Subscribe to the store values
    $effect(() => {
        categories = $categoriesStore;
    });
    
    onMount(async () => {
        try {
            await loadAllCategories();
        } catch (err) {
            console.error("Failed to load categories:", err);
        }
    });

    function toggleSheet() {
        sheetOpen = !sheetOpen;
        sheetOpenStore.set(sheetOpen);
        closeAuthPopup();
        closeAccountPopUp();
    }

    function onLogout() {
        logout();
        closeAccountPopUp();
    }

    function toggleAuthPopup() {
        authPopupOpen = !authPopupOpen;
    }

    function closeAuthPopup() {
        authPopupOpen = false;
    }

    function toggleAccountPopUp() {
        accountPopUpOpen = !accountPopUpOpen;
    }

    function closeAccountPopUp() {
        accountPopUpOpen = false;
    }

    function toggleCartPopUp() {
        cartPopupOpen = !cartPopupOpen;
    }

    function closeCartPopUp() {
        cartPopupOpen = false;
    }

    function handleAdminNavigation(e: Event) {
        e.preventDefault();
        
        // Get both the access and refresh tokens
        const accessToken = getToken();
        const refreshToken = getRefreshToken();
        
        if (!accessToken) {
            console.error("No valid access token found");
            return;
        }
        
        // Store both tokens in localStorage for our server hooks to retrieve
        localStorage.setItem('supabase_access_token', accessToken);
        if (refreshToken) {
            localStorage.setItem('supabase_refresh_token', refreshToken);
        }
        
        // Set cookies for server-side authentication
        document.cookie = `supabase-auth-token=${accessToken}; path=/; max-age=10000; SameSite=Lax`;
        
        // Make a fetch request with the Authorization header first to validate authorization
        fetch('/admin/products', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        .then(response => {
            if (response.ok || response.redirected) {
                // If authorization is successful, navigate to admin page
                window.location.href = '/admin/products';
            } else {
                console.error('Access denied to admin page');
                alert('You do not have permission to access the admin page');
            }
        })
        .catch(err => {
            console.error('Error checking admin access:', err);
        });
    }

    const popupControls: PopupControls = {
        get authPopupOpen() {
            return authPopupOpen;
        },
        get accountPopUpOpen() {
            return accountPopUpOpen;
        },
        get cartPopupOpen() {
            return cartPopupOpen;
        },
        toggleAuthPopup,
        closeAuthPopup,
        toggleAccountPopUp,
        closeAccountPopUp,
        toggleCartPopUp,
        closeCartPopUp,
    };

    $effect(() => {
        if (browser) {
            const handleResize = () => {
                if (window.innerWidth > 640) {
                    closeAccountPopUp();
                    closeAuthPopup();
                    closeCartPopUp();
                    TransitionEvent.apply;
                    sheetOpen = false;
                    sheetOpenStore.set(false);
                }
            };

            window.addEventListener("resize", handleResize);

            handleResize();

            return () => {
                window.removeEventListener("resize", handleResize);
            };
        }
    });
</script>

{#snippet TopNavbar()}
    <div
        class="sm:flex-row flex items-center justify-between flex-row-reverse bg-gray-100 p-2 border-b border-gray-300"
    >
        <!-- Left section (e.g., settings icon) -->
        <a href="/">
            <div class="flex items-center ml-3 sm:pr-3">
                <Button variant="default">
                    <img src="/gearly_logo.svg" alt="Settings" class="w-12 h-12" />
                </Button>
                <span class="hidden sm:block pl-1 text-xl">Gearly</span>
            </div>
        </a>

        <!-- Center section (search input) -->
        <SearchBar bind:searchQuery />

        <!-- Mobile -->
        <div class="sm:hidden mt-1 mr-3">
            <Button variant="default" onclick={toggleSheet}>
                <img src="/menu.svg" alt="hamburger menu" class="w-10 h-10" />
            </Button>
        </div>

        <MobileSheet 
            {sheetOpen} 
            {toggleSheet} 
            {popupControls} 
            {onLogout} 
            {categories}
            isLoading={$isCategoriesLoading}
            error={$categoriesError}
        />

        <!-- Right section Shopping Icon & Account Avatar -->
        {@render UserControls()}
    </div>
{/snippet}

{#snippet UserControls()}
    <div class="hidden sm:flex items-centery79 flex-row gap-3 pl-3">
        <CartPopup isOpen={cartPopupOpen} onClose={closeCartPopUp} />
        <Button variant="icon" onclick={toggleCartPopUp}>
            <img
                src="/shopping_cart.svg"
                alt="Shopping Cart"
                class="w-10 h-10 white"
            />
        </Button>
        {#if !$user}
            <AuthPopup isOpen={authPopupOpen} onClose={closeAuthPopup} />
            <Button variant="icon" onclick={toggleAuthPopup}>
                <img
                    src="/avatar.svg"
                    alt="Login"
                    class="w-10 h-10 white"
                />
            </Button>
        {:else}
            <AccountPopup
                isOpen={accountPopUpOpen}
                onClose={closeAccountPopUp}
                {onLogout}
            />
            <Button variant="icon" onclick={toggleAccountPopUp}>
                <img
                    src="/avatar.svg"
                    alt="Account Centrum"
                    class="w-10 h-10 white"
                />
            </Button>
        {/if}
    </div>
{/snippet}

{#snippet CategoryNavbar()}
    <!-- Bottom Section -->
    <nav
        class="hidden sm:flex items-center justify-between flex-row bg-gray-100 p-1 border-b border-gray-300 px-10 transition-all duration-300 ease-in-out"
    >
        <!-- Dynamic categories loaded from database -->
        {#if $isCategoriesLoading}
            <span class="text-gray-400">Loading categories...</span>
        {:else if $categoriesError}
            <span class="text-red-500">Error: {$categoriesError}</span>
        {:else}
            {#each categories as category}
                <Button variant="navigation">
                    <a href={`/categories/${category.name}`} class="text-gray-900 hover:text-gray-700">
                        <span>{category.name}</span>
                    </a>
                </Button>
            {/each}
        {/if}
        
        <!-- Admin Button - Only visible for admin users -->
        {#if $user && $isAdmin}
            <Button variant="navigation">
                <a 
                    href="/admin/products" 
                    class="text-gray-900 hover:text-gray-700"
                    onclick={handleAdminNavigation}
                >
                    <span>Admin</span>
                </a>
            </Button>
        {/if}
    </nav>
{/snippet}

<nav class="flex flex-col">
    {@render TopNavbar()}
    {@render CategoryNavbar()}
</nav>
