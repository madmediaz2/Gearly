<script lang="ts">
    import { onMount } from "svelte";
    import "../app.css";
    import Searchbar from "../components/Navbar.svelte";
    import { initializeAuth, updateUser } from "$lib/stores/authStore";
    import Footer from "../components/Footer.svelte";
    import ComparisonPopup from "../components/ComparisonPopup.svelte";
    import { getRefreshToken, getToken } from "$lib/stores/authStore"
    import { supabase } from "$lib/supabaseClient";
    import { browser } from "$app/environment";
    let { children } = $props();

    onMount(async () => {
        if (browser) {
            await initializeAuth();
            
            // Get tokens from our stores after initialization
            const accessToken = getToken();
            const refreshToken = getRefreshToken();
            
            // Only set session if we have a token
            if (accessToken) {
                console.log('Setting Supabase session with stored tokens');
                await supabase.auth.setSession({
                    access_token: accessToken, 
                    refresh_token: refreshToken || ''
                });
                
                // Verify session is active
                const { data, error } = await supabase.auth.getSession();
                if (data?.session) {
                    console.log('Session verified successfully');
                }
            }
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
