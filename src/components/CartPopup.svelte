<script lang="ts">
    import Popup from "./ui/Popup.svelte";


    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    const { isOpen, onClose }: Props = $props();

</script>


<Popup title="Winkelwagen" {isOpen} {onClose}>
    <div>

    </div>
</Popup>