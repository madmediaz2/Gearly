<script lang="ts">
    import Popup from "./ui/Popup.svelte";
    import { getUsername } from "$lib/stores/authStore";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        onLogout: () => void;
    }

    const { isOpen, onClose, onLogout }: Props = $props();
</script>

<Popup title={getUsername() || "Account Centrum"} isOpen={isOpen} onClose={onClose}>
    <div>
        <button onclick={onLogout} class="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 pointer-events-auto cursor-pointer disabled:opacity-50" >
            Log out
        </button>
    </div>
</Popup>
