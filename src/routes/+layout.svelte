<script lang="ts">
    import { onMount } from "svelte";
    import "../app.css";
    import Searchbar from "../components/Navbar.svelte";
    import { initializeAuth } from "$lib/stores/authStore";
    let { children } = $props();

    onMount(() => {
        initializeAuth();
    });
</script>

<Searchbar />
{@render children()}
