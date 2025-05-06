<script lang="ts">
    import { onMount } from "svelte";
    import Button from "../ui/Button.svelte";
    import Input from "../ui/Input.svelte";
    import {
        fetchSpecificationAttributes,
        getProductSpecifications,
        setProductSpecification,
        removeProductSpecification,
        createSpecificationAttribute,
    } from "$lib/api/specificationsApi";
    import type { SpecificationAttribute } from "$lib/types/supabaseTypes";

    interface Props {
        productId: number;
    }

    const { productId }: Props = $props();

    let attributes = $state<SpecificationAttribute[]>([]);
    let productSpecs = $state<
        { attribute: SpecificationAttribute; value: string }[]
    >([]);
    let loading = $state(true);
    let error = $state<string>();

    // For adding new specification
    let selectedAttributeId = $state<number | null>();
    let specValue = $state<string>("");
    
    // For creating new attributes
    let newAttributeName = $state<string>("");
    let newAttributeSlug = $state<string>("");
    let newAttributeUnit = $state<string>("");
    let creatingAttribute = $state(false);

    async function setProduct(){
        productSpecs = await getProductSpecifications(productId);
    }

    onMount(async () => {
        try {
            loading = true;
            attributes = await fetchSpecificationAttributes();
			

            if (productId) {
                setProduct()
				updateAvailableAttributes()
            }
        } catch (err: any) {
            error = err.message || "Failed to load specifications";
            console.error(error);
        } finally {
            loading = false;
        }
    });

	$effect(() => {
		setProduct()
	})

    async function addSpecification() {
        if (!selectedAttributeId || !specValue.trim() || !productId) {
            error = "Please select an attribute and enter a value";
            return;
        }

        error = "";
        try {
            // Add the specification to the product
            await setProductSpecification(
                productId,
                selectedAttributeId,
                specValue.trim(),
            );

            // Refresh the product specifications
            productSpecs = await getProductSpecifications(productId);

            // Reset form
            selectedAttributeId = null;
            specValue = "";
        } catch (err: any) {
            error = err.message || "Failed to add specification";
            console.error(error);
        }
    }

    let availableAttributes = $state<SpecificationAttribute[]>([]);

    function updateAvailableAttributes() {
        availableAttributes = attributes.filter(
            (attr) =>
                !productSpecs.some((spec) => spec.attribute.id === attr.id),
        );
    }

	$effect(() => {
		const _ = productId
		updateAvailableAttributes()
	})

    async function removeSpec(attributeId: number) {
        try {
            if (productId) {
                await removeProductSpecification(productId, attributeId);
                productSpecs = productSpecs.filter(
                    (spec) => spec.attribute.id !== attributeId,
                );
            }
        } catch (err: any) {
            error = err.message || "Failed to remove specification";
            console.error(error);
        }
    }
    
    async function handleCreateAttribute() {
        if (!newAttributeName.trim()) {
            error = "Please enter an attribute name";
            return;
        }
        
        error = "";
        creatingAttribute = true;
        
        try {
            // Create the new attribute
            const newAttribute = await createSpecificationAttribute({
                name: newAttributeName.trim(),
                slug: newAttributeSlug.trim() || undefined,
                unit: newAttributeUnit.trim() || null
            });
            
            // Add to attributes list
            attributes = [...attributes, newAttribute];
            
            // Reset form
            newAttributeName = "";
            newAttributeSlug = "";
            newAttributeUnit = "";
            
        } catch (err: any) {
            error = err.message || "Failed to create attribute";
            console.error(error);
        } finally {
            creatingAttribute = false;
        }
    }
</script>

<div class="mt-6 p-4 border border-gray-200 rounded-md">
    <h3 class="text-xl font-semibold text-gray-800 mt-0">Product Specifications</h3>

    {#if error}
        <div class="text-red-600 mb-4 p-2 bg-red-100 rounded">
            {error}
        </div>
    {/if}

    {#if loading}
        <p class="py-2">Loading specifications...</p>
    {:else}
        <!-- Current specifications -->
        <div class="mt-6">
            <h4 class="text-lg font-medium text-gray-700 mb-3">Current Specifications</h4>
            {#if productSpecs.length === 0}
                <p class="text-gray-500 italic">No specifications added yet</p>
            {:else}
                <table class="w-full border-collapse mb-4">
                    <thead>
                        <tr>
                            <th class="text-left py-2 px-2 border-b-2 border-gray-200 font-semibold text-gray-700">Attribute</th>
                            <th class="text-left py-2 px-2 border-b-2 border-gray-200 font-semibold text-gray-700">Value</th>
                            <th class="text-left py-2 px-2 border-b-2 border-gray-200 font-semibold text-gray-700">Unit</th>
                            <th class="text-left py-2 px-2 border-b-2 border-gray-200 font-semibold text-gray-700">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each productSpecs as spec}
                            <tr>
                                <td class="py-2 px-2 border-b border-gray-200">{spec.attribute.name}</td>
                                <td class="py-2 px-2 border-b border-gray-200">{spec.value}</td>
                                <td class="py-2 px-2 border-b border-gray-200">{spec.attribute.unit || "-"}</td>
                                <td class="py-2 px-2 border-b border-gray-200">
                                    <button
                                        class="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded"
                                        onclick={() => removeSpec(spec.attribute.id)}
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </div>

        <!-- Add new specification -->
        <div class="mt-6">
            <h4 class="text-lg font-medium text-gray-700 mb-3">Add Specification</h4>

            <div class="mb-4">
                <label class="block mb-2 font-medium">
                    Attribute:
                    <select 
                        bind:value={selectedAttributeId}
                        class="w-full p-2 border border-gray-200 rounded-md bg-white mt-1"
                    >
                        <option value={null}>Select an attribute</option>
                        {#each availableAttributes as attr}
                            <option value={attr.id}>
                                {attr.name}
                                {attr.unit ? `(${attr.unit})` : ""}
                            </option>
                        {/each}
                    </select>
                </label>
            </div>

            <div class="mb-4">
                <label class="block mb-2 font-medium">
                    Value:
                    <Input
                        type="text"
                        bind:bindValue={specValue}
                        placeholder="Enter specification value"
                    />
                </label>
            </div>

            <Button
                disabled={!selectedAttributeId || !specValue.trim()}
                onclick={addSpecification}
            >
                Add Specification
            </Button>
        </div>

        <!-- Create new attribute -->
        <div class="mt-8 border-t border-gray-200 pt-6">
            <h4 class="text-lg font-medium text-gray-700 mb-3">Create New Attribute</h4>
            
            <div class="mb-4">
                <label class="block mb-2 font-medium">
                    Attribute Name:
                    <Input
                        type="text"
                        bind:bindValue={newAttributeName}
                        placeholder="Enter attribute name"
                    />
                </label>
            </div>

            <div class="mb-4">
                <label class="block mb-2 font-medium">
                    Slug:
                    <Input
                        type="text"
                        bind:bindValue={newAttributeSlug}
                        placeholder="Enter attribute slug"
                    />
                </label>
            </div>

            <div class="mb-4">
                <label class="block mb-2 font-medium">
                    Unit (optional):
                    <Input
                        type="text"
                        bind:bindValue={newAttributeUnit}
                        placeholder="e.g. GB, MHz, inches"
                    />
                </label>
            </div>

            <Button
                disabled={!newAttributeName.trim() || creatingAttribute}
                onclick={handleCreateAttribute}
            >
                {creatingAttribute ? "Creating..." : "Create Attribute"}
            </Button>
        </div>

        
    {/if}
</div>