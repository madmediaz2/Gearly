<script lang="ts">
    import { cn } from "$lib/utils/index";
    import type { Snippet } from "svelte";

    type ButtonVariant = "default" | "icon" | "footer" | "navigation" | "mobile-nav" | "link" | "social";
    type ButtonSize = "sm" | "md" | "lg";
    type ButtonType = "button" | "submit" | "reset" | null | undefined

    interface Props{
        children?: Snippet;
        variant?: ButtonVariant;
        size?: ButtonSize;
        disabled?: boolean;
        className?: string;
        onclick?: () => void;
        type?: ButtonType
    }
    
    const { children, variant="default", size="md", disabled=false, className="", onclick, type}: Props = $props();

    const variantStyles = {
        default: "pointer-events-auto cursor-pointer",
        icon: "cursor-pointer",
        footer: "cursor-pointer hover:opacity-80 transition-opacity",
        navigation: "pointer-events-auto cursor-pointer hover:bg-gray-200 p-1 rounded",
        "mobile-nav": "pointer-events-auto cursor-pointer w-full flex items-center py-3 px-2 text-left hover:bg-gray-100 rounded-md",
        link: "text-gray-600 hover:text-gray-900 cursor-pointer",
        social: "w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black pointer-events-auto cursor-pointer"
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
    type={type}
>
   {@render children?.()}
</button>