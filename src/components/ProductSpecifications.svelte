<script lang="ts">
    import type { SpecificationAttribute } from "$lib/types/supabaseTypes";

    export let specifications:
        | Array<{ attribute: SpecificationAttribute; value: string }>
        | undefined = undefined;
</script>

{#if specifications && specifications.length > 0}
    <div class="mt-8 p-4 rounded-lg bg-slate-50">
        <h3 class="font-semibold text-xl mb-3 text-slate-800 border-b border-slate-200 pb-2">Specifications</h3>

        <table class="w-full border-collapse">
            <tbody>
                {#each specifications as spec}
                    <tr class="border-b border-slate-200 last:border-b-0">
                        <th class="text-left py-3 px-2 font-medium text-slate-500 w-2/5 align-top">
                            {spec.attribute.name}
                        </th>
                        <td class="py-3 px-2 text-slate-900 align-top">
                            {spec.value}
                            {#if spec.attribute.unit}
                                <span class="text-sm text-slate-500 ml-1">{spec.attribute.unit}</span>
                            {/if}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/if}
