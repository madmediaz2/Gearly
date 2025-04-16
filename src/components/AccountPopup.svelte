<script lang="ts">
    import Popup from "./ui/Popup.svelte";
    import Button from "./ui/Button.svelte";
    import { getUsername, isLoading as isLoadingStore, changeUsername, changePassword, isOAuthLogin } from "$lib/stores/authStore";
    import { writable } from "svelte/store";
    import { onDestroy } from "svelte";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        onLogout: () => void;
    }

    const { isOpen, onClose, onLogout }: Props = $props();
    
    let username = $state(getUsername())
    
    // Update username whenever the user store changes
    $effect(() => {
        username = getUsername() || "";
    })

    let isLoading = $state(false);
    const unsubscribe = isLoadingStore.subscribe(value => {
        isLoading = value;
    });
    onDestroy(unsubscribe);
    
    // profile edit state
    let newUsername = $state(getUsername() || "")
    let newPassword = $state();
    let processingUsername = $state(false);
    let processingPassword = $state(false);
    const oauth = isOAuthLogin();

    async function handleUsernameChange() {
      processingUsername = true;
      try {
        await changeUsername(newUsername);
        // Update the local username state after successful change
        username = newUsername;
      } catch (error) {
        console.error("Error updating username:", error);
      } finally {
        processingUsername = false;
      }
    }

    async function handlePasswordChange() {
      processingPassword = true;
      try {
        await changePassword(newPassword as string);

      } catch (error) {

      }
      processingPassword = false;
      newPassword = "";
    }
</script>

<Popup title={username || "Account Centrum"} isOpen={isOpen} onClose={onClose} bind:isLoading >
    <div class="space-y-4">
        <!-- Change Username -->
        <div>
            <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
            <input id="username" type="text" bind:value={newUsername} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            <Button onclick={handleUsernameChange} disabled={processingUsername} className="mt-2">Update Username</Button>
        </div>
        <!-- Change Password (if not OAuth) -->
        {#if !oauth}
        <div>
            <label for="new-password" class="block text-sm font-medium text-gray-700">New Password</label>
            <input id="new-password" type="password" bind:value={newPassword} class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
            <Button onclick={handlePasswordChange} disabled={processingPassword} className="mt-2">Update Password</Button>
        </div>
        {/if}
        <!-- Log out -->
        <div>
            <Button onclick={onLogout} variant="primary" disabled={isLoading} className="w-full">Log out</Button>
        </div>
    </div>
</Popup>
