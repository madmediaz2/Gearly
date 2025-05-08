<script lang="ts">
    import { onMount } from "svelte";
    import Button from "../ui/Button.svelte";
    import Input from "../ui/Input.svelte";
    import NotificationMessage from "../ui/NotificationMessage.svelte";
    import { loadBrands } from "$lib/api/productApi";
    import { createBrand, deleteBrand } from "$lib/api/supabaseApi";

    // State variables
    let brands = $state<{ id: number; name: string }[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let success = $state<string | null>(null);

    // Form state for brand
    let brandName = $state("");
    let brandImageFile = $state<File | null>(null);
    let creatingBrand = $state(false);

    onMount(async () => {
        await loadBrandsData();
    });

    async function loadBrandsData() {
        try {
            loading = true;
            brands = await loadBrands();
            loading = false;
        } catch (err: any) {
            error = err.message || "Failed to load brands";
            console.error(error);
            loading = false;
        }
    }

    async function handleCreateBrand() {
        if (!brandName.trim()) {
            error = "Please enter a brand name";
            return;
        }

        error = null;
        success = null;
        creatingBrand = true;

        try {
            await createBrand(brandName, brandImageFile || undefined);
            await loadBrandsData();

            // Reset form
            brandName = "";
            brandImageFile = null;

            success = "Brand created successfully";
        } catch (err: any) {
            error = err.message || "Failed to create brand";
            console.error(error);
        } finally {
            creatingBrand = false;
        }
    }

    async function handleDeleteBrand(brandId: number) {
        if (
            !confirm(
                "Are you sure you want to delete this brand? This may affect products using this brand.",
            )
        ) {
            return;
        }

        try {
            await deleteBrand(brandId);
            await loadBrandsData();

            success = "Brand deleted successfully";
        } catch (err: any) {
            error = err.message || "Failed to delete brand";
            console.error(error);
        }
    }

    function handleImageChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            brandImageFile = input.files[0];
        }
    }
</script>



{#snippet CreateBrandForm()}
    <h3 class="text-lg font-medium text-gray-700 mb-3">Create New Brand</h3>

    <div class="mb-4">
        <label class="block mb-2 font-medium">
            Brand Name:
            <Input
                type="text"
                bind:bindValue={brandName}
                placeholder="Enter brand name"
            />
        </label>
    </div>

    <div class="mb-4">
        <label class="block mb-2 font-medium">
            Brand Image:
            <input
                type="file"
                accept="image/*"
                onchange={handleImageChange}
                class="w-full p-2 border border-gray-200 rounded-md bg-white mt-1"
            />
        </label>

        {#if brandImageFile}
            <p class="mt-1 text-sm text-gray-500">
                Selected file: {brandImageFile.name}
            </p>
        {/if}
    </div>

    <Button disabled={!brandName.trim() || creatingBrand} onclick={handleCreateBrand}>
        {creatingBrand ? "Creating..." : "Create Brand"}
    </Button>
{/snippet}

{#snippet BrandsTable(brands: { id: number; name: string }[])}
    <h3 class="text-lg font-medium text-gray-700 mb-3">Existing Brands</h3>

    {#if brands.length === 0}
        <p class="text-gray-500 italic">No brands found</p>
    {:else}
        <table class="w-full border-collapse">
            <thead>
                <tr>
                    <th
                        class="text-left py-2 px-2 border-b-2 border-gray-200 font-semibold text-gray-700"
                        >ID</th
                    >
                    <th
                        class="text-left py-2 px-2 border-b-2 border-gray-200 font-semibold text-gray-700"
                        >Name</th
                    >
                    <th
                        class="text-left py-2 px-2 border-b-2 border-gray-200 font-semibold text-gray-700"
                        >Action</th
                    >
                </tr>
            </thead>
            <tbody>
                {#each brands as brand}
                    <tr>
                        <td class="py-2 px-2 border-b border-gray-200"
                            >{brand.id}</td
                        >
                        <td class="py-2 px-2 border-b border-gray-200"
                            >{brand.name}</td
                        >
                        <td class="py-2 px-2 border-b border-gray-200">
                            <Button
                                variant="error"
                                onclick={() => handleDeleteBrand(brand.id)}
                            >
                                Delete
                            </Button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
{/snippet}

<div>
    <h2 class="text-xl font-semibold mb-4">Brand Management</h2>

    <NotificationMessage message={error} type="error" />
    <NotificationMessage message={success} type="success" />

    {#if loading}
        <p class="py-2">Loading brands...</p>
    {:else}
        <div>
            <div class="mb-6">
                {@render CreateBrandForm()}
            </div>
            <div>
                {@render BrandsTable(brands)}
            </div>
        </div>
    {/if}
</div>
