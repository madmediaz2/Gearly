<script lang="ts">
    import Button from "./ui/Button.svelte";
    import Input from "./ui/Input.svelte";

    export let searchQuery = "";
</script>

<form
    class="block w-80 opacity-100 scale-100 xl:min-w-2xl lg:min-w-xl md:min-w-md transition-all duration-300 ease-in-out"
>
    <label
        for="default-search"
        class="mb-2 text-sm font-medium text-gray-900 sr-only">Search</label
    >
    <div class="relative">
        <Input
            id="default-search"
            variant="search"
            placeholder="Zoeken naar producten.."
            required
            bind:bindValue={searchQuery}
        />
        <Button
            type="submit"
            variant="default"
            className="text-white absolute end-1 bottom-[0.3rem] sm:end-2.5 sm:bottom-2.5 bg-black hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-2 py-2"
        >Zoeken</Button>
    </div>
</form>
