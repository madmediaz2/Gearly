<script lang="ts">
    import { browser } from "$app/environment";
    import { fly } from "svelte/transition";
    import { supabase } from "$lib/supabaseClient";
    import { user, updateUser } from "$lib/stores/authStore";
    import Popup from "./ui/Popup.svelte";
    import Button from "./ui/Button.svelte";
    import Input from "./ui/Input.svelte";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    const { isOpen, onClose }: Props = $props();

    let isLogin: boolean = $state(true);
    let email: string = $state("");
    let password: string = $state("");
    let name: string = $state("");
    let errorMessage: string = $state("");
    let isLoading: boolean = $state(false);

    function toggleView() {
        isLogin = !isLogin;
        errorMessage = "";
    }

    async function handleGoogleLogin() {
        try {
            isLoading = true;
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
        } catch (error: Error | any) {
            console.error("Error with Google login:", error);
            errorMessage =
                error.message ||
                "Er is een fout opgetreden bij het inloggen met Google.";
        } finally {
            isLoading = false;
        }
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        errorMessage = "";
        isLoading = true;

        try {
            if (isLogin) {
                // Login with email and password
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                // Update the user store
                updateUser(data.user);
                
                // Save the token for both client and server-side authentication
                if (data.session?.access_token) {
                    const { setToken } = await import("$lib/stores/authStore");
                    
                    // Set the token in localStorage and as a cookie
                    setToken(
                        data.session.access_token,
                        data.session.refresh_token || null
                    );
                    
                    console.log("Auth tokens saved successfully");
                }
                
                onClose();
            } else {
                // Sign up with email and password
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        },
                    },
                });

                if (error) throw error;

                // Update the user store if immediate sign-in
                if (data.user) {
                    updateUser(data.user);
                }
                console.log("Registration successful");
                onClose();
            }
        } catch (error: Error | any) {
            console.error("Authentication error:", error);
            errorMessage =
                error.message ||
                "Er is een fout opgetreden bij de authenticatie.";
        } finally {
            isLoading = false;
        }
    }

    $effect(() => {
        if (browser && isOpen) {
            const handleEscKey = (event: KeyboardEvent) => {
                if (event.key === "Escape") {
                    onClose();
                }
            };

            window.addEventListener("keydown", handleEscKey);

            return () => {
                window.removeEventListener("keydown", handleEscKey);
            };
        }
    });
</script>

<Popup
    title={isLogin ? "Inloggen" : "Registreren"}
    {isOpen}
    {onClose}
    {errorMessage}
    bind:isLoading
>
    <!-- Form -->
    <form onsubmit={handleSubmit} class="space-y-4">
        {#if !isLogin}
            <div>
                <Input
                    id="name"
                    label="Naam"
                    type="text"
                    required
                    disabled={isLoading}
                    bind:bindValue={name}
                />
            </div>
        {/if}
        <div>
            <Input
                id="email"
                label="Email"
                type="email"
                required
                disabled={isLoading}
                bind:bindValue={email}
            />
        </div>
        <div>
            <Input
                id="password"
                label="Wachtwoord"
                type="password"
                required
                disabled={isLoading}
                bind:bindValue={password}
            />
        </div>
        <div>
            <Button
                type="submit"
                disabled={isLoading}
                variant="primary"
                className="w-full"
            >
                {#if isLoading}
                    <span>Bezig...</span>
                {:else}
                    {isLogin ? "Inloggen" : "Registreren"}
                {/if}
            </Button>
        </div>
    </form>

    <!-- Google Login -->
    <div class="mt-4">
        <Button
            type="button"
            variant="social"
            className="w-full"
            onclick={handleGoogleLogin}
            disabled={isLoading}
        >
            <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google logo"
                class="h-5 w-5 mr-2"
            />
            Doorgaan met Google
        </Button>
    </div>

    <!-- Toggle View -->
    <div class="mt-4 text-center">
        <Button
            type="button"
            variant="link"
            size="sm"
            onclick={toggleView}
            disabled={isLoading}
        >
            {isLogin
                ? "Nog geen account? Registreer hier"
                : "Heb je al een account? Log in"}
        </Button>
    </div>
</Popup>
