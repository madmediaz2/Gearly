<script lang="ts">
    import { browser } from "$app/environment";
    import { fly } from "svelte/transition";
    import { supabase } from "$lib/supabaseClient";
    import { user, updateUser } from "$lib/stores/authStore";
    import Popup from "./ui/Popup.svelte";
    import Button from "./ui/Button.svelte";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    const { isOpen, onClose }: Props = $props();

    // Local state
    let isLogin: boolean = $state(true);
    let email: string = $state("");
    let password: string = $state("");
    let name: string = $state("");
    let isSmallScreen: boolean = $state(false);
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

    async function handleSubmit(event: Event) {
        event.preventDefault();
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
                console.log("Login successful");
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
        if (browser) {
            const handleResize = () => {
                if (window.innerWidth > 640) {
                    isSmallScreen = false;
                } else {
                    isSmallScreen = true;
                }
            };

            window.addEventListener("resize", handleResize);

            handleResize();

            return () => {
                window.removeEventListener("resize", handleResize);
            };
        }
    });

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

<Popup title={isLogin ? "Inloggen" : "Registreren"} {isOpen} {onClose} errorMessage={errorMessage}>
    <!-- Form -->
    <form onsubmit={handleSubmit} class="space-y-4">
        {#if !isLogin}
            <div>
                <label
                    for="name"
                    class="block text-sm font-medium text-gray-700">Naam</label
                >
                <input
                    type="text"
                    id="name"
                    bind:value={name}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                    required
                    disabled={isLoading}
                />
            </div>
        {/if}

        <div>
            <label for="email" class="block text-sm font-medium text-gray-700"
                >Email</label
            >
            <input
                type="email"
                id="email"
                bind:value={email}
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                required
                disabled={isLoading}
            />
        </div>

        <div>
            <label
                for="password"
                class="block text-sm font-medium text-gray-700"
                >Wachtwoord</label
            >
            <input
                type="password"
                id="password"
                bind:value={password}
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                required
                disabled={isLoading}
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
