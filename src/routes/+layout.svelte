<script lang="ts">
  import "../app.css";
  import Searchbar from "../components/Navbar.svelte";
  let { children } = $props();
</script>

<Searchbar />
{@render children()}
