<script lang="ts">
    import ButtonMap from "../../components/ui/ButtonMap.svelte";
    import InputMap from "../../components/ui/InputMap.svelte";
</script>

<div class="container mx-auto py-8">
    <h1 class="text-3xl font-bold mb-6">UI Component Library</h1>
    <p class="mb-8">This page showcases the UI components available in the Gearly design system.</p>
    
    <div class="space-y-12">
        <section>
            <h2 class="text-2xl font-semibold mb-4">Button Components</h2>
            <ButtonMap />
        </section>
        <section>
            <h2 class="text-2xl font-semibold mb-4">Input Components</h2>
            <InputMap />
        </section>
    </div>

</div>