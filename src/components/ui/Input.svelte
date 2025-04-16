<script lang="ts">
    import { cn } from "$lib/utils/index";
    import type { Snippet } from 'svelte';
    import type { ClassValue } from "svelte/elements";

    interface InputProps extends HTMLInputElement {
        variant?: 'text' | 'search' | 'discount' | 'button';
        label?: string;
        bindValue?: string;
        buttonStyling?: ClassValue; 
        Button?: Snippet;
    }

    let {
        variant = 'text',
        id = '',
        label = '',
        placeholder = '',
        type = 'text',
        disabled = false,
        required = false,
        className = '',
        bindValue = $bindable(),
        buttonStyling = '',
        Button = undefined,
    }: Partial<InputProps> = $props();

    const variantStyles = {
        text: "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black",
        search: "block w-full p-3 ps-8 sm:p-4 sm:ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-gray-500 focus:border-gray-500",
        discount: "p-2 text-center border border-gray-300 rounded w-full sm:w-48 focus:outline-none",
        button: "mt-2 block w-full px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
    };
    
    const inputClasses = $derived(
        cn(
            variantStyles[variant],
            className
        )
    );
</script>

{#if label}
  <label for={id} class="block text-sm font-medium text-gray-700">{label}</label>
{/if}

{#if variant === 'search'}
  <div class="relative">
    <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
      <svg class="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
      </svg>
    </div>
    <input
      id={id}
      type="search"
      class={inputClasses}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      bind:value={bindValue}
    />
  </div>
{:else if variant === 'discount'}
  <input
    id={id}
    type="text"
    class={inputClasses}
    placeholder={placeholder}
    required={required}
    disabled={disabled}
    bind:value={bindValue}
  />
{:else}
  <div class={Button && "relative px-1"}>
    <input
      id={id}
      type={type}
      class={[Button && variantStyles.button, inputClasses]}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      bind:value={bindValue}
    >
    {#if Button}
      <div class={[buttonStyling ,"absolute inset-y-0 end-0 flex items-center"]}>
        {@render Button?.()}
      </div>
    {/if}
  </div>
{/if}
 