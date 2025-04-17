<script lang="ts">
    import { onMount } from "svelte";
    import "../app.css";
    import Searchbar from "../components/Navbar.svelte";
    import { initializeAuth } from "$lib/stores/authStore";
    import Footer from "../components/Footer.svelte";
    let { children } = $props();

    onMount(() => {
        initializeAuth();
    });
</script>

<div class="flex flex-col min-h-screen">
    <header class="m-0 p-0 mx-0 px-0">
        <Searchbar />
    </header>
    <main class="flex-1">
        {@render children()}
    </main>
    <Footer />
</div>
