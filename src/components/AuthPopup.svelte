<script lang="ts">
  import { browser } from "$app/environment";
  import { fly } from "svelte/transition";

  let { isOpen, onClose }: { isOpen: boolean; onClose: () => void } = $props();

  // Local state
  let isLogin: boolean = $state(true);
  let email: string = $state("");
  let password: string = $state("");
  let name: string = $state("");
  let isSmallScreen: boolean = $state(false);

  function toggleView() {
    isLogin = !isLogin;
  }

  function handleGoogleLogin() {
    console.log("Google login clicked");
  }

  function handleSubmit() {
    if (isLogin) {
      console.log("Login attempt:", { email, password });
    } else {
      console.log("Registration attempt:", { name, email, password });
    }
  }

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
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">
            {isLogin ? "Inloggen" : "Registreren"}
          </h2>
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <button
            class="text-gray-500 hover:text-gray-700 pointer-events-auto cursor-pointer"
            onclick={onClose}
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

        <!-- Form -->
        <form onsubmit={handleSubmit} class="space-y-4">
          {#if !isLogin}
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700"
                >Naam</label
              >
              <input
                type="text"
                id="name"
                bind:value={name}
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                required
              />
            </div>
          {/if}

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700"
              >Email</label
            >
            <input
              type="email"
              id="email"
              bind:value={email}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              required
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700">Wachtwoord</label
            >
            <input
              type="password"
              id="password"
              bind:value={password}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              class="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 pointer-events-auto cursor-pointer"
            >
              {isLogin ? "Inloggen" : "Registreren"}
            </button>
          </div>
        </form>

        <!-- Google Login -->
        <div class="mt-4">
          <button
            type="button"
            class="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black pointer-events-auto cursor-pointer"
            onclick={handleGoogleLogin}
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google logo"
              class="h-5 w-5 mr-2"
            />
            Doorgaan met Google
          </button>
        </div>

        <!-- Toggle View -->
        <div class="mt-4 text-center">
          <button
            type="button"
            class="text-sm text-gray-600 hover:text-gray-900"
            onclick={toggleView}
          >
            {isLogin
              ? "Nog geen account? Registreer hier"
              : "Heb je al een account? Log in"}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
