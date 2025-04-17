<script lang="ts">
    import { cn } from "$lib/utils/index";
    import type { Snippet } from "svelte";

    type ButtonVariant = "default" | "icon" | "footer" | "navigation" | "mobile-nav";
    type ButtonSize = "sm" | "md" | "lg";

    interface Props{
        children: Snippet;
        variant?: ButtonVariant;
        size?: ButtonSize;
        disabled?: boolean;
        className?: string;
        onclick?: () => void;
    }
    
    const { children, variant="default", size="md", disabled=false, className="", onclick}: Props = $props();

    const variantStyles = {
        default: "pointer-events-auto cursor-pointer",
        icon: "cursor-pointer",
        footer: "cursor-pointer hover:opacity-80 transition-opacity",
        navigation: "pointer-events-auto cursor-pointer hover:bg-gray-200 p-1 rounded",
        "mobile-nav": "pointer-events-auto cursor-pointer w-full flex items-center py-3 px-2 text-left hover:bg-gray-100 rounded-md"
    };

    const sizeStyles = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg"
    };

    const buttonClasses = $derived(cn(
        variantStyles[variant],
        sizeStyles[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
    ));

</script>

<button
    class={buttonClasses}
    {disabled}
    onclick={onclick}
>
   {@render children?.()}
</button>