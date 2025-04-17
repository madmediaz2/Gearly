<script lang="ts">
    import { browser } from "$app/environment";
    import AuthPopup from "./AuthPopup.svelte";
    import MobileSheet from "./MobileSheet.svelte";
    import SearchBar from "./ui/SearchBar.svelte";
    import { user, getUsername, logout } from "$lib/stores/authStore";
	import AccountPopup from "./AccountPopup.svelte";

    let searchQuery = $state("");
    let sheetOpen = $state(false);
    let authPopupOpen = $state(false);
    let accountPopUpOpen = $state(false);

    function toggleSheet() {
        sheetOpen = !sheetOpen;
		closeAuthPopup()
		closeAccountPopUp()
    }

	function onLogout(){
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

    $effect(() => {
        if (browser) {
            const handleResize = () => {
                if (window.innerWidth > 640) {
                    sheetOpen = false;
					closeAccountPopUp()
					closeAuthPopup()
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

<nav class="flex flex-col">
    <div
        class="sm:flex-row flex items-center justify-between flex-row-reverse bg-gray-100 p-4 border-b border-gray-300"
    >
        <!-- Left section (e.g., settings icon) -->
        <div class="flex items-center ml-3 sm:pr-3">
            <button class="pointer-events-auto cursor-pointer">
                <img src="/gearly_logo.svg" alt="Settings" class="w-12 h-12" />
            </button>
            <span class="hidden sm:block pl-1 text-xl">Gearly</span>
        </div>

        <!-- Center section (search input) -->
        <SearchBar bind:searchQuery />

        <!-- Mobile -->
        <div class="sm:hidden mt-1 mr-3">
            <button
                onclick={toggleSheet}
                class="pointer-events-auto cursor-pointer"
            >
                <img src="/menu.svg" alt="hamburger menu" class="w-10 h-10" />
            </button>
        </div>

        <!-- Mobile Sheet Component -->
        <MobileSheet {sheetOpen} {toggleSheet} />

        <!-- Right section Shopping Icon & Account Avatar -->
        <div class="hidden sm:flex items-centery79 flex-row gap-3 pl-3">
            <button class="cursor-pointer">
                <img
                    src="/shopping_cart.svg"
                    alt="Shopping Cart"
                    class="w-10 h-10 white"
                />
            </button>
            {#if !$user}
                <AuthPopup isOpen={authPopupOpen} onClose={closeAuthPopup} />
                <button class="cursor-pointer" onclick={toggleAuthPopup}>
                    <img
                        src="/avatar.svg"
                        alt="Login"
                        class="w-10 h-10 white"
                    />
                </button>
            {:else}
				<AccountPopup isOpen={accountPopUpOpen} onClose={closeAccountPopUp} onLogout={onLogout} />
                <button class="cursor-pointer" onclick={toggleAccountPopUp}>
                    <img
                        src="/avatar.svg"
                        alt="Account Centrum"
                        class="w-10 h-10 white"
                    />
                </button>
            {/if}
        </div>
    </div>

    <!-- Bottom Section -->
    <div
        class="hidden sm:flex items-center justify-between flex-row bg-gray-100 p-1 border-b border-gray-300 px-10 transition-all duration-300 ease-in-out"
    >
        <button
            class="pointer-events-auto cursor-pointer hover:bg-gray-200 p-1 rounded"
        >
            <div class="flex flex-row">
                <img src="/menu.svg" alt="menu" />
                <span>Categorieen</span>
            </div>
        </button>
        <button
            class="pointer-events-auto cursor-pointer hover:bg-gray-200 p-1 rounded"
        >
            <span>Aanbiedingen</span>
        </button>
        <button
            class="pointer-events-auto cursor-pointer hover:bg-gray-200 p-1 rounded"
        >
            <span>Laptops</span>
        </button>
        <button
            class="pointer-events-auto cursor-pointer hover:bg-gray-200 p-1 rounded"
        >
            <span>Desktops</span>
        </button>
        <button
            class="pointer-events-auto cursor-pointer hover:bg-gray-200 p-1 rounded"
        >
            <span>Tweede Kans</span>
        </button>
        <button
            class="pointer-events-auto cursor-pointer hover:bg-gray-200 p-1 rounded"
        >
            <span>Mobiel</span>
        </button>
    </div>
</nav>
