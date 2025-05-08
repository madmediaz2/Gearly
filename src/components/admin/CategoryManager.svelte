<script lang="ts">
    import { onMount } from "svelte";
    import Button from "../ui/Button.svelte";
    import Input from "../ui/Input.svelte";
    import NotificationMessage from "../ui/NotificationMessage.svelte";
    import { loadCategories } from "$lib/api/productApi";
    import { createCategory as createCategoryApi, deleteCategory as deleteCategoryApi } from "$lib/api/supabaseApi";
    
    // State variables
    let categories = $state<{id: number, name: string, slug?: string}[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let success = $state<string | null>(null);
    
    // Form state for category
    let categoryName = $state("");
    let categorySlug = $state("");
    let creatingCategory = $state(false);
    
    onMount(async () => {
        await loadCategoriesData();
    });
    
    async function loadCategoriesData() {
        try {
            loading = true;
            categories = await loadCategories();
            loading = false;
        } catch (err: any) {
            error = err.message || "Failed to load categories";
            console.error(error);
            loading = false;
        }
    }
    
    async function handleCreateCategory() {
        if (!categoryName.trim()) {
            error = "Please enter a category name";
            return;
        }
        
        error = null;
        success = null;
        creatingCategory = true;
        
        try {
            await createCategoryApi(categoryName, categorySlug);
            await loadCategoriesData();
            
            // Reset form
            categoryName = "";
            categorySlug = "";
            
            success = "Category created successfully";
        } catch (err: any) {
            error = err.message || "Failed to create category";
            console.error(error);
        } finally {
            creatingCategory = false;
        }
    }
    
    async function handleDeleteCategory(categoryId: number) {
        if (!confirm("Are you sure you want to delete this category? This may affect products using this category.")) {
            return;
        }
        
        error = null;
        success = null;
        
        try {
            await deleteCategoryApi(categoryId);
            await loadCategoriesData();
            
            success = "Category deleted successfully";
        } catch (err: any) {
            error = err.message || "Failed to delete category";
            console.error(error);
        }
    }
</script>

{#snippet CreateCategoryForm()}
    <h3 class="text-lg font-medium text-gray-700 mb-3">Create New Category</h3>
    
    <div class="mb-4">
        <label class="block mb-2 font-medium">
            Category Name:
            <Input
                type="text"
                bind:bindValue={categoryName}
                placeholder="Enter category name"
            />
        </label>
    </div>
    
    <div class="mb-4">
        <label class="block mb-2 font-medium">
            Slug (optional):
            <Input
                type="text"
                bind:bindValue={categorySlug}
                placeholder="Enter category slug"
            />
            <span class="text-xs text-gray-500">If left empty, a slug will be generated from the name</span>
        </label>
    </div>
    
    <Button
        disabled={!categoryName.trim() || creatingCategory}
        onclick={handleCreateCategory}
    >
        {creatingCategory ? "Creating..." : "Create Category"}
    </Button>
{/snippet}

{#snippet CategoriesTable(categories: {id: number, name: string, slug?: string}[])}
    <h3 class="text-lg font-medium text-gray-700 mb-3">Existing Categories</h3>
    
    {#if categories.length === 0}
        <p class="text-gray-500 italic">No categories found</p>
    {:else}
        <table class="w-full border-collapse">
            <thead>
                <tr>
                    <th class="text-left py-2 px-2 border-b-2 border-gray-200 font-semibold text-gray-700">ID</th>
                    <th class="text-left py-2 px-2 border-b-2 border-gray-200 font-semibold text-gray-700">Name</th>
                    <th class="text-left py-2 px-2 border-b-2 border-gray-200 font-semibold text-gray-700">Slug</th>
                    <th class="text-left py-2 px-2 border-b-2 border-gray-200 font-semibold text-gray-700">Action</th>
                </tr>
            </thead>
            <tbody>
                {#each categories as category}
                    <tr>
                        <td class="py-2 px-2 border-b border-gray-200">{category.id}</td>
                        <td class="py-2 px-2 border-b border-gray-200">{category.name}</td>
                        <td class="py-2 px-2 border-b border-gray-200">{category.slug || "-"}</td>
                        <td class="py-2 px-2 border-b border-gray-200">
                            <Button
                                variant="error"
                                onclick={() => handleDeleteCategory(category.id)}
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
    <h2 class="text-xl font-semibold mb-4">Category Management</h2>
    
    <NotificationMessage message={error} type="error" />
    <NotificationMessage message={success} type="success" />
    
    {#if loading}
        <p class="py-2">Loading categories...</p>
    {:else}
        <div>
            <div class="mb-6">
                {@render CreateCategoryForm()}
            </div>
            <div>
                {@render CategoriesTable(categories)}
            </div>
        </div>
    {/if}
</div>
