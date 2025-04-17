<script lang="ts">
    import Button from "./ui/Button.svelte";
</script>

<div class="flex justify-between bg-gray-100 w-full text-center content-center px-3 py-0.5">
    <span class="py-1" >© 2025 Gearly B.V.</span>
    <div class="flex flex-row gap-2 py-1">
        <Button variant="footer">
            <img src="/Twitter.svg" alt="twitter" class="w-6 h-6 white" />
        </Button>
        <Button variant="footer">
            <img src="/Instagram.svg" alt="instagram" class="w-6 h-6 white" />
        </Button>
    </div>
</div>
