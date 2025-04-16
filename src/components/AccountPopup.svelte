<script lang="ts">
    import Popup from "./ui/Popup.svelte";
    import Button from "./ui/Button.svelte";
    import Input from "./ui/Input.svelte";
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
      isLoading = true;
      try {
        await changeUsername(newUsername);
        // Update the local username state after successful change
        username = newUsername;
      } catch (error) {
        console.error("Error updating username:", error);
      } finally {
        isLoading = false;
      }
    }

    async function handlePasswordChange() {
      isLoading = true;
      try {
        await changePassword(newPassword as string);

      } catch (error) {

      }
      isLoading = false;
      newPassword = "";
    }
</script>

<Popup title={username || "Account Centrum"} isOpen={isOpen} onClose={onClose} bind:isLoading >
    <div class="space-y-4">
        <!-- Change Username -->
        <div>
            <Input id="username" label="Username" type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" bind:bindValue={newUsername} />
            <Button onclick={handleUsernameChange} disabled={processingUsername} className="mt-2">Update Username</Button>
        </div>
        <!-- Change Password (if not OAuth) -->
        {#if !oauth}
        <div>
            <Input id="new-password" label="New Password" type="password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" bind:bindValue={newPassword as string} />
            <Button onclick={handlePasswordChange} disabled={processingPassword} className="mt-2">Update Password</Button>
        </div>
        {/if}
        <!-- Log out -->
        <div>
            <Button onclick={onLogout} variant="primary" disabled={isLoading} className="w-full">Log out</Button>
        </div>
    </div>
</Popup>
