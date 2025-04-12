<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount, onDestroy } from "svelte";
  import { fly } from "svelte/transition";
  import AuthPopup from "./AuthPopup.svelte";

  let searchQuery = "";
  let sheetOpen = $state(false);
  let authPopupOpen = $state(false);

  function toggleSheet() {
    sheetOpen = !sheetOpen;
    authPopupOpen = false;
  }

  function toggleAuthPopup() {
    authPopupOpen = !authPopupOpen;
  }

  function closeAuthPopup() {
    authPopupOpen = false;
  }

  $effect(() => {
    if (browser) {
      const handleResize = () => {
        if (window.innerWidth > 640) {
          sheetOpen = false;
          authPopupOpen = false;
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
    <form
      class="block w-80 opacity-100 scale-100 xl:min-w-2xl lg:min-w-xl md:min-w-md transition-all duration-300 ease-in-out"
    >
      <label
        for="default-search"
        class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
        >Search</label
      >
      <div class="relative">
        <div
          class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"
        >
          <svg
            class="w-4 h-4 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
        <input
          type="search"
          id="default-search"
          class="block w-full p-3 ps-8 sm:p-4 sm:ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-focus-500 dark:focus:border-focus-500"
          placeholder="Zoeken naar producten.."
          required
        />
        <button
          type="submit"
          class="text-white absolute end-1 bottom-[0.3rem] sm:end-2.5 sm:bottom-2.5 bg-black hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-2 py-2 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
          >Zoeken</button
        >
      </div>
    </form>

    <!-- Mobile -->
    <div class="sm:hidden mt-1 mr-3">
      <button onclick={toggleSheet} class="pointer-events-auto cursor-pointer">
        <img src="/menu.svg" alt="hamburger menu" class="w-10 h-10" />
      </button>
    </div>

    <!-- Mobile Sheet -->
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
                <img src="/gearly_logo.svg" alt="Gearly" class="w-10 h-10" />
                <span class="ml-2 text-xl font-medium">Gearly</span>
              </div>
              <!-- svelte-ignore a11y_consider_explicit_label -->
              <button
                class="rounded-md text-gray-500 hover:bg-gray-100 p-2"
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
              </button>
            </div>
            <!-- Navigation Links -->
            <div class="py-2 px-4 grow">
              <button
                class="w-full flex items-center py-3 px-2 text-left hover:bg-gray-100 rounded-md"
              >
                <img src="/menu.svg" alt="menu" class="mr-2" />
                <span>Categorieen</span>
              </button>
              <button
                class="w-full flex items-center py-3 px-2 text-left hover:bg-gray-100 rounded-md"
              >
                <span>Aanbiedingen</span>
              </button>
              <button
                class="w-full flex items-center py-3 px-2 text-left hover:bg-gray-100 rounded-md"
              >
                <span>Laptops</span>
              </button>
              <button
                class="w-full flex items-center py-3 px-2 text-left hover:bg-gray-100 rounded-md"
              >
                <span>Desktops</span>
              </button>
              <button
                class="w-full flex items-center py-3 px-2 text-left hover:bg-gray-100 rounded-md"
              >
                <span>Mobiel</span>
              </button>
              <button
                class="w-full flex items-center py-3 px-2 text-left hover:bg-gray-100 rounded-md"
              >
                <span>Tweede Kans</span>
              </button>
            </div>
            <!-- User Actions -->
            <div class="border-t border-gray-200 py-4 px-4 mt-auto">
              <button
                class="w-full flex items-center py-3 px-2 text-left hover:bg-gray-100 rounded-md"
              >
                <img
                  src="/shopping_cart.svg"
                  alt="Shopping Cart"
                  class="w-6 h-6 mr-2"
                />
                <span>Winkelwagen</span>
              </button>

              <button
                class="w-full flex items-center py-3 px-2 text-left hover:bg-gray-100 rounded-md"
                onclick={toggleAuthPopup}
              >
                <img src="/avatar.svg" alt="Account" class="w-6 h-6 mr-2" />
                <span>Inloggen</span>
              </button>
              <AuthPopup isOpen={authPopupOpen} onClose={closeAuthPopup} />
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Right section Shopping Icon & Account Avatar -->
    <div class="hidden sm:flex items-center flex-row gap-3 pl-3">
      <button class="cursor-pointer">
        <img
          src="/shopping_cart.svg"
          alt="Shopping Cart"
          class="w-10 h-10 white"
        />
      </button>
      <!-- Auth Popup -->
      <AuthPopup isOpen={authPopupOpen} onClose={closeAuthPopup} />
      <button class="cursor-pointer" onclick={toggleAuthPopup}>
        <img src="/avatar.svg" alt="Shopping Cart" class="w-10 h-10 white" />
      </button>
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
