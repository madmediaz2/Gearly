<script lang="ts">
    import type { HTMLButtonAttributes } from "svelte/elements";
    import { cn } from "$lib/utils/index";
    import type { Snippet } from "svelte";

    type ButtonVariant = "default" | "icon" | "footer" | "navigation";
    type ButtonSize = "sm" | "md" | "lg";

    interface Props {
        children: Snippet;
        variant?: ButtonVariant;
        size?: ButtonSize;
        disabled?: boolean;
        className?: string;
        onclick?: () => void;
    }

    const {
        children,
        variant = "default",
        size = "md",
        disabled = false,
        className = "",
        onclick,
    }: Props = $props();

    const variantStyles = {
        default: "pointer-events-auto cursor-pointer",
        icon: "cursor-pointer",
        footer: "cursor-pointer hover:opacity-80 transition-opacity",
        navigation:
            "pointer-events-auto cursor-pointer hover:bg-gray-200 p-1 rounded",
    };

    const sizeStyles = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
    };

    const buttonClasses = $derived(
        cn(
            variantStyles[variant],
            sizeStyles[size],
            disabled && "opacity-50 cursor-not-allowed",
            className,
        ),
    );
</script>

<button class={buttonClasses} {disabled} {onclick}>
    {@render children?.()}
</button>
