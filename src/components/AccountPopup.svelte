<script lang="ts">
    import Popup from "./ui/Popup.svelte";
    import Button from "./ui/Button.svelte";
    import Input from "./ui/Input.svelte";
    import {
        getUsername,
        isLoading as isLoadingStore,
        changeUsername,
        changePassword,
        isOAuthLogin,
    } from "$lib/stores/authStore";
    import { onDestroy } from "svelte";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        onLogout: () => void;
    }

    const { isOpen, onClose, onLogout }: Props = $props();

    let username = $state(getUsername());

    // Update username whenever the user store changes
    $effect(() => {
        username = getUsername() || "";
    });

    let isLoading = $state(false);
    let errorMessage = $state<string>()
    const unsubscribe = isLoadingStore.subscribe((value) => {
        isLoading = value;
    });
    onDestroy(unsubscribe);

    // profile edit state
    let newUsername = $state(getUsername() || "");
    let newPassword = $state();
    

    const oauth = isOAuthLogin();

    async function handleUsernameChange() {
        isLoading = true;
        try {
            await changeUsername(newUsername);
            // Update the local username state after successful change
            username = newUsername;
        } catch (error) {
            console.error("Error updating username:", error);
            errorMessage = error as string
        } finally {
            isLoading = false;
        }
    }

    async function handlePasswordChange() {
        isLoading = true;
        try {
            await changePassword(newPassword as string);
        } catch (error) {
            console.error("Error updating password:", error);
            errorMessage = error as string
        } finally{
            isLoading = false;
            newPassword = "";
        }
    }
</script>

{#snippet updateButton()}
    <Button
        onclick={handleUsernameChange}
        disabled={isLoading}
        variant="primary"
        className="flex text-center justify-center h-8 -translate-x-3 px-1 items-center"
    >
        <span>{isLoading ? 'Loading...' :'Update'}</span>
    </Button>
{/snippet}

{#snippet updatePasswordButton()}
    <Button
        onclick={handlePasswordChange}
        disabled={isLoading}
        variant="primary"
        className="flex text-center justify-center h-8 -translate-x-3 px-1 items-center"
    >
    <span>{isLoading ? 'Loading...' :'Update'}</span>
</Button>
{/snippet}

<Popup
    title={username || "Account Centrum"}
    {isOpen}
    {onClose}
    bind:isLoading
    titleSeperator
    errorMessage={errorMessage}
>
    <div class="space-y-4">
        <!-- Change Username -->
        <div>
            <Input
                id="username"
                label="Update Username"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                bind:bindValue={newUsername}
                Button={updateButton}
            />
        </div>
        <!-- Change Password (if not OAuth) -->
        {#if !oauth}
            <div>
                <Input
                    id="new-password"
                    label="New Password"
                    type="password"
                    bind:bindValue={newPassword as string}
                    Button={updatePasswordButton}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
            </div>
        {/if}
        <!-- Log out -->
        <div>
            <Button
                onclick={onLogout}
                variant="primary"   
                disabled={isLoading}
                className="w-full">{isLoading ? 'Loading...' : "Log out"}</Button
            >
        </div>
    </div>
</Popup>
