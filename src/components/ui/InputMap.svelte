<script lang="ts">
  import Input from './Input.svelte';
</script>

<div class="p-6 bg-white shadow-md rounded-lg">
  <h1 class="text-2xl font-bold mb-6">Input Component UI Map</h1>
  <div class="space-y-8">
    <!-- Text Input Variants -->
    <div>
      <h2 class="text-xl font-semibold mb-3">Text Input</h2>
      <div class="space-y-4">
        <Input variant="text" placeholder="Enter text" />
        <Input variant="text" placeholder="Disabled" disabled />
        <Input variant="text" placeholder="Required" required />
      </div>
    </div>

    <!-- Search Input Variant -->
    <div>
      <h2 class="text-xl font-semibold mb-3">Search Input</h2>
      <Input variant="search" placeholder="Search..." />
    </div>

    <!-- Discount Input Variant -->
    <div>
      <h2 class="text-xl font-semibold mb-3">Discount Input</h2>
      <Input variant="discount" placeholder="Coupon code" />
    </div>

    <!-- Button Input Variant -->
    <div>
      <h2 class="text-xl font-semibold mb-3">Button Input</h2>
      <Input variant="button" placeholder="Enter text or action" />
    </div>
  </div>
</div>
