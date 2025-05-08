<script lang="ts">
    import { onMount } from "svelte";
    import Button from "../ui/Button.svelte";
    import Input from "../ui/Input.svelte";
    import {
        fetchSpecificationAttributes,
        createSpecificationAttribute,
        deleteSpecificationAttribute,
    } from "$lib/api/specificationsApi";
    import type { SpecificationAttribute } from "$lib/types/supabaseTypes";

    // State variables
    let attributes = $state<SpecificationAttribute[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let success = $state<string | null>(null);

    // Form state for new attribute
    let newAttributeName = $state<string>("");
    let newAttributeSlug = $state<string>("");
    let newAttributeUnit = $state<string>("");
    let creatingAttribute = $state(false);

    onMount(async () => {
        await loadAttributes();
    });

    async function loadAttributes() {
        try {
            loading = true;
            error = null;

            attributes = await fetchSpecificationAttributes();

        } catch (err: any) {
            error = err.message || "Failed to load attributes";
            console.error(error);
        } finally {
            loading = false;
        }
    }

    async function handleCreateAttribute() {
        if (!newAttributeName.trim()) {
            error = "Please enter an attribute name";
            return;
        }

        error = null;
        success = null;
        creatingAttribute = true;

        try {
            // Create the new attribute
            const newAttribute = await createSpecificationAttribute({
                name: newAttributeName.trim(),
                slug: newAttributeSlug.trim() || undefined,
                unit: newAttributeUnit.trim() || null,
            });

            // Add to attributes list
            attributes = [...attributes, newAttribute];

            // Reset form
            newAttributeName = "";
            newAttributeSlug = "";
            newAttributeUnit = "";

            success = "Attribute created successfully";

        } catch (err: any) {
            error = err.message || "Failed to create attribute";
            console.error(error);
        } finally {
            creatingAttribute = false;
        }
    }

    async function deleteAttribute(attributeId: number) {
        if (
            !confirm(
                "Are you sure you want to delete this attribute? This may affect products using this attribute.",
            )
        ) {
            return;
        }

        try {
            error = null;
            success = null;

            await deleteSpecificationAttribute(attributeId);

            // Remove from local list
            attributes = attributes.filter((attr) => attr.id !== attributeId);

            success = "Attribute deleted successfully";

        } catch (err: any) {
            error = err.message || "Failed to delete attribute";
            console.error(error);
        }
    }
</script>

{#snippet NotificationMessage(message: string | null, type: 'error' | 'success')}
    {#if message}
        <div class="text-{type === 'error' ? 'red' : 'green'}-600 mb-4 p-2 bg-{type === 'error' ? 'red' : 'green'}-100 rounded">
            {message}
        </div>
    {/if}
{/snippet}

{#snippet CreateAttributeForm()}
    <div class="mb-6">
        <h3 class="text-lg font-medium text-gray-700 mb-3">
            Create New Attribute
        </h3>

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
{/snippet}

{#snippet AttributesTable(attributes: SpecificationAttribute[])}
    <div>
        <h3 class="text-lg font-medium text-gray-700 mb-3">
            Available Attributes
        </h3>

        {#if attributes.length === 0}
            <p class="text-gray-500 italic">No attributes found</p>
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
                            >Slug</th
                        >
                        <th
                            class="text-left py-2 px-2 border-b-2 border-gray-200 font-semibold text-gray-700"
                            >Unit</th
                        >
                        <th
                            class="text-left py-2 px-2 border-b-2 border-gray-200 font-semibold text-gray-700"
                            >Action</th
                        >
                    </tr>
                </thead>
                <tbody>
                    {#each attributes as attribute}
                        <tr>
                            <td class="py-2 px-2 border-b border-gray-200"
                                >{attribute.id}</td
                            >
                            <td class="py-2 px-2 border-b border-gray-200"
                                >{attribute.name}</td
                            >
                            <td class="py-2 px-2 border-b border-gray-200"
                                >{attribute.slug || "-"}</td
                            >
                            <td class="py-2 px-2 border-b border-gray-200"
                                >{attribute.unit || "-"}</td
                            >
                            <td class="py-2 px-2 border-b border-gray-200">
                                <Button
                                    variant="error"
                                    onclick={() =>
                                        deleteAttribute(attribute.id)}
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
{/snippet}

<div>
    <h2 class="text-xl font-semibold mb-4">Attribute Management</h2>

    {@render NotificationMessage(error, 'error')}
    {@render NotificationMessage(success, 'success')}

    {#if loading}
        <p class="py-2">Loading attributes...</p>
    {:else}
        <!-- Create new attribute -->
        {@render CreateAttributeForm()}

        <!-- Attributes list -->
        {@render AttributesTable(attributes)}
    {/if}
</div>
