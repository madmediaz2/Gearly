<!-- filepath: /Users/diaz/Developer/examen/Gearly/src/components/admin/BrandManager.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import Button from "../ui/Button.svelte";
    import Input from "../ui/Input.svelte";
    import { loadBrands } from "$lib/api/productApi";
    import { supabase } from "$lib/supabaseClient";

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

    async function createBrand() {
        if (!brandName.trim()) {
            error = "Please enter a brand name";
            return;
        }

        error = null;
        success = null;
        creatingBrand = true;

        try {
            // Create the brand in the database
            const { data: brandData, error: brandError } = await supabase
                .from("brands")
                .insert([{ name: brandName.trim() }])
                .select("id")
                .single();

            if (brandError) throw brandError;

            // Upload the brand image if one was provided
            if (brandImageFile && brandData?.id) {
                const fileExt = brandImageFile.name.split(".").pop();
                const fileName = `brand_${brandData.id}_${Date.now()}.${fileExt}`;
                const filePath = `brand-images/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("brands")
                    .upload(filePath, brandImageFile);

                if (uploadError) {
                    console.error("Error uploading image:", uploadError);
                    throw new Error("Failed to upload brand image");
                }

                const { data: publicUrl } = supabase.storage
                    .from("brands")
                    .getPublicUrl(filePath);

                if (publicUrl) {
                    // Update the brand with the image URL
                    const { error: updateError } = await supabase
                        .from("brands")
                        .update({ image_url: publicUrl.publicUrl })
                        .eq("id", brandData.id);

                    if (updateError) {
                        console.error(
                            "Error updating brand with image:",
                            updateError,
                        );
                    }
                }
            }

            // Refresh brands list
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

    async function deleteBrand(brandId: number) {
        if (
            !confirm(
                "Are you sure you want to delete this brand? This may affect products using this brand.",
            )
        ) {
            return;
        }

        try {
            const { error: deleteError } = await supabase
                .from("brands")
                .delete()
                .eq("id", brandId);

            if (deleteError) throw deleteError;

            // Refresh brands list
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

<div>
    <h2 class="text-xl font-semibold mb-4">Brand Management</h2>

    {#if error}
        <div class="text-red-600 mb-4 p-2 bg-red-100 rounded">
            {error}
        </div>
    {/if}

    {#if success}
        <div class="text-green-600 mb-4 p-2 bg-green-100 rounded">
            {success}
        </div>
    {/if}

    {#if loading}
        <p class="py-2">Loading brands...</p>
    {:else}
        <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-700 mb-3">
                Create New Brand
            </h3>

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

            <Button
                disabled={!brandName.trim() || creatingBrand}
                onclick={createBrand}
            >
                {creatingBrand ? "Creating..." : "Create Brand"}
            </Button>
        </div>

        <!-- Brands list -->
        <div>
            <h3 class="text-lg font-medium text-gray-700 mb-3">
                Existing Brands
            </h3>

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
                                        onclick={() => deleteBrand(brand.id)}
                                    >
                                        Delete
                                    </Button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    {/if}
</div>
