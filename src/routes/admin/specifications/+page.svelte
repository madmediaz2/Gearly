<script lang="ts">
    import { onMount } from 'svelte';
    import Button from '../../../components/ui/Button.svelte';
    import Input from '../../../components/ui/Input.svelte';
    import { 
        fetchSpecificationAttributes, 
        createSpecificationAttribute,
        updateSpecificationAttribute,
        deleteSpecificationAttribute
    } from '$lib/api/specificationsApi';
    import type { SpecificationAttribute } from '$lib/types/supabaseTypes';
    
    let attributes = $state<SpecificationAttribute[]>([]);
    let loading = $state(true);
    let error = $state<string>();
    let success = $state<string>();
    
    let isEditing = $state(false);
    let editingId = $state<number | null>();
    let name = $state<string>();
    let slug = $state<string>();
    let unit = $state<string>();
    
    onMount(async () => {
        await loadAttributes();
    });
    
    async function loadAttributes() {
        try {
            loading = true;
            error = '';
            success = '';
            attributes = await fetchSpecificationAttributes();
        } catch (err: any) {
            error = err.message || 'Failed to load specification attributes';
        } finally {
            loading = false;
        }
    }
    
    function startCreate() {
        isEditing = false;
        editingId = null;
        name = '';
        slug = '';
        unit = '';
    }
    
    function startEdit(attribute: SpecificationAttribute) {
        isEditing = true;
        editingId = attribute.id;
        name = attribute.name;
        slug = attribute.slug;
        unit = attribute.unit || '';
    }
    
    function generateSlug(nameValue: string) {
        if (!nameValue) return '';
        return nameValue.toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }

    $effect(() => {
        if (name && !isEditing) {
            slug = generateSlug(name);
        }
    })
    
    async function saveAttribute(e: Event) {
        e.preventDefault();
        if (!name) {
            error = 'Name is required';
            return;
        }
        
        if (!slug) {
            slug = generateSlug(name);
        }
        
        error = '';
        success = '';
        loading = true;
        
        try {
            if (isEditing && editingId) {
                await updateSpecificationAttribute(editingId, { name, slug, unit: unit || null });
                success = 'Attribute updated successfully';
            } else {
                await createSpecificationAttribute({ name, slug, unit: unit || null });
                success = 'Attribute created successfully';
            }
            
            name = '';
            slug = '';
            unit = '';
            isEditing = false;
            editingId = null;
            
            await loadAttributes();
        } catch (err: any) {
            error = err.message || 'Failed to save attribute';
        } finally {
            loading = false;
        }
    }
    
    async function removeAttribute(id: number) {
        if (!confirm('Are you sure you want to delete this specification attribute? This will also remove it from all products.')) {
            return;
        }
        
        error = '';
        success = '';
        
        try {
            await deleteSpecificationAttribute(id);
            success = 'Attribute deleted successfully';
            
            // If we were editing this attribute, reset the form
            if (editingId === id) {
                isEditing = false;
                editingId = null;
                name = '';
                slug = '';
                unit = '';
            }
            
            await loadAttributes();
        } catch (err: any) {
            error = err.message || 'Failed to delete attribute';
        }
    }
</script>

<div class="container mx-auto p-4 max-w-4xl">
    <h1 class="text-2xl font-bold mb-6">Manage Specification Attributes</h1>
    
    {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{error}</p>
        </div>
    {/if}
    
    {#if success}
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{success}</p>
        </div>
    {/if}
    
    <div class="flex mb-8 gap-8">
        <!-- Form -->
        <div class="w-1/2 p-4 border rounded-lg bg-white shadow-sm">
            <h2 class="text-xl font-semibold mb-4">
                {isEditing ? 'Edit Attribute' : 'Create New Attribute'}
            </h2>
            
            <form class="space-y-4" onsubmit={saveAttribute}>
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700">Name *</label>
                    <Input 
                        id="name" 
                        type="text" 
                        bind:bindValue={name}
                        placeholder="e.g. Weight, Color, Memory" 
                        required
                    />
                </div>
                
                <div>
                    <label for="slug" class="block text-sm font-medium text-gray-700">Slug</label>
                    <Input 
                        id="slug" 
                        type="text" 
                        bind:bindValue={slug} 
                        placeholder="e.g. weight, color, memory"
                    />
                </div>
                
                <div>
                    <label for="unit" class="block text-sm font-medium text-gray-700">Unit</label>
                    <Input 
                        id="unit" 
                        type="text" 
                        bind:bindValue={unit} 
                        placeholder="e.g. kg, mm, GB"
                    />
                </div>
                
                <div class="flex gap-2">
                    <Button 
                        type="submit" 
                        variant="primary"
                        disabled={loading || !name}
                    >
                        {isEditing ? 'Update Attribute' : 'Create Attribute'}
                    </Button>
                    
                    {#if isEditing}
                        <Button 
                            type="button" 
                            variant="secondary"
                            onclick={startCreate}
                        >
                            Cancel
                        </Button>
                    {/if}
                </div>
            </form>
        </div>
        
        <!-- List -->
        <div class="w-1/2">
            <h2 class="text-xl font-semibold mb-4">Specification Attributes</h2>
            
            {#if loading && attributes.length === 0}
                <p class="text-gray-500">Loading attributes...</p>
            {:else if attributes.length === 0}
                <p class="text-gray-500">No specification attributes defined yet.</p>
            {:else}
                <div class="border rounded-lg overflow-hidden">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            {#each attributes as attribute (attribute.id)}
                                <tr class:bg-blue-50={editingId === attribute.id}>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-medium text-gray-900">{attribute.name}</div>
                                        <div class="text-sm text-gray-500">{attribute.slug}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        {attribute.unit || '-'}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button 
                                            class="text-indigo-600 hover:text-indigo-900 mr-3"
                                            onclick={() => startEdit(attribute)}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            class="text-red-600 hover:text-red-900"
                                            onclick={() => removeAttribute(attribute.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>
    </div>
</div>
