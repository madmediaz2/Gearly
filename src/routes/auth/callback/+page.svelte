<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { supabase } from "$lib/supabaseClient";
    import { user, updateUser } from "$lib/stores/authStore";

    let error = "";

    onMount(async () => {
        try {
            // Handle the OAuth callback
            const { data, error: authError } = await supabase.auth.getSession();

            if (authError) throw authError;

            if (data?.session?.user) {
                // Update the user store with the authenticated user
                updateUser(data.session.user);

                // Redirect to the homepage or dashboard after successful authentication
                goto("/");
            } else {
                throw new Error("No user session found");
            }
        } catch (err: any) {
            console.error("Error in auth callback:", err);
            error =
                err.message ||
                "Er is een fout opgetreden tijdens het authenticatieproces.";
        }
    });
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
    <div class="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        {#if error}
            <div class="p-4 mb-4 bg-red-100 text-red-700 rounded-md">
                <p>{error}</p>
                <a href="/" class="mt-4 text-black underline">Terug naar home</a
                >
            </div>
        {:else}
            <div class="text-center">
                <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
                    Authenticatie verwerken...
                </h2>
                <div class="mt-4">
                    <div class="loader"></div>
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .loader {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-left-color: #000;
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
