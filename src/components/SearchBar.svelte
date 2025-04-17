<script lang="ts">
    import Button from "./ui/Button.svelte";

  export let searchQuery = "";
</script>

<form class="block w-80 opacity-100 scale-100 xl:min-w-2xl lg:min-w-xl md:min-w-md transition-all duration-300 ease-in-out">
  <label
    for="default-search"
    class="mb-2 text-sm font-medium text-gray-900 sr-only"
    >Search</label
  >
  <div class="relative">
    <div
      class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none"
    >
      <svg
        class="w-4 h-4 text-gray-500"
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
      class="block w-full p-3 ps-8 sm:p-4 sm:ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-gray-500 focus:border-gray-500"
      placeholder="Zoeken naar producten.."
      required
      bind:value={searchQuery}
    />
    <Button
      type="submit"
      variant="default"
      className="text-white absolute end-1 bottom-[0.3rem] sm:end-2.5 sm:bottom-2.5 bg-black hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-2 py-2"
      >Zoeken</Button
    >
  </div>
</form>
