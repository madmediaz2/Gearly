<script lang="ts">
    export let message: string | null = null;
    export let type: 'error' | 'success' = 'success';
</script>

{#if message}
    <div class="text-{type === 'error' ? 'red' : 'green'}-600 mb-4 p-2 bg-{type === 'error' ? 'red' : 'green'}-100 rounded">
        {message}
    </div>
{/if}
