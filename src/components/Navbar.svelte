<script lang="ts">
    import { browser } from "$app/environment";
    import AuthPopup from "./AuthPopup.svelte";
    import MobileSheet from "./MobileSheet.svelte";
    import SearchBar from "./SearchBar.svelte";
    import { user, logout } from "$lib/stores/authStore";
    import AccountPopup from "./AccountPopup.svelte";
    import CartPopup from "./CartPopup.svelte";
    import { type PopupControls } from "$lib/types/popupTypes";
    import Button from "./ui/Button.svelte";

    let searchQuery = $state("");
    let sheetOpen = $state(false);
    let authPopupOpen = $state(false);
    let accountPopUpOpen = $state(false);
    let cartPopupOpen = $state(false);

    function toggleSheet() {
        sheetOpen = !sheetOpen;
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
        class="sm:flex-row flex items-center justify-between flex-row-reverse bg-gray-100 p-2 border-b border-gray-300"
    >
        <!-- Left section (e.g., settings icon) -->
        <div class="flex items-center ml-3 sm:pr-3">
            <Button variant="default">
                <img src="/gearly_logo.svg" alt="Settings" class="w-12 h-12" />
            </Button>
            <span class="hidden sm:block pl-1 text-xl">Gearly</span>
        </div>

        <!-- Center section (search input) -->
        <SearchBar bind:searchQuery />

        <!-- Mobile -->
        <div class="sm:hidden mt-1 mr-3">
            <Button variant="default" onclick={toggleSheet}>
                <img src="/menu.svg" alt="hamburger menu" class="w-10 h-10" />
            </Button>
        </div>

        <MobileSheet {sheetOpen} {toggleSheet} {popupControls} {onLogout} />

        <!-- Right section Shopping Icon & Account Avatar -->
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
    </div>

    <!-- Bottom Section -->
    <nav
        class="hidden sm:flex items-center justify-between flex-row bg-gray-100 p-1 border-b border-gray-300 px-10 transition-all duration-300 ease-in-out"
    >
        <Button variant="navigation">
            <div class="flex flex-row">
                <img src="/menu.svg" alt="menu" />
                <span>Categorieen</span>
            </div>
        </Button>
        <Button variant="navigation">
            <span>Aanbiedingen</span>
        </Button>
        <Button variant="navigation">
            <span>Laptops</span>
        </Button>
        <Button variant="navigation">
            <span>Desktops</span>
        </Button>
        <Button variant="navigation">
            <span>Tweede Kans</span>
        </Button>
        <Button variant="navigation">
            <span>Mobiel</span>
        </Button>
    </nav>
</nav>
