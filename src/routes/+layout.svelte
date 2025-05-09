<script lang="ts" module>
    import { supabase } from "$lib/supabaseClient";
    import { browser } from "$app/environment";

    if (browser) {
        // Make Supabase available globally for debugging
        window.supabase = supabase;
    }
</script>

<script lang="ts">
    import { onMount } from "svelte";
    import "../app.css";
    import Searchbar from "../components/Navbar.svelte";
    import { initializeAuth, updateUser } from "$lib/stores/authStore";
    import Footer from "../components/Footer.svelte";
    import ComparisonPopup from "../components/ComparisonPopup.svelte";
    import { getRefreshToken, getToken } from "$lib/stores/authStore"
    let { children } = $props();

    onMount(async () => {
        if (browser) {
            // Initialize auth which handles JWT token validation
            await initializeAuth();
            await supabase.auth.setSession({access_token: getToken() || '', refresh_token: getRefreshToken() || '' })
        }
    });
</script>

<div class="flex flex-col min-h-screen">
    <header class="m-0 p-0 mx-0 px-0">
        <Searchbar />
    </header>
    <main class="flex-1">
        {@render children()}
    </main>
    <footer>
        <Footer />
    </footer>
    <ComparisonPopup />
</div>
