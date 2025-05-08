<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { clearCart } from '$lib/stores/cart';
    import { updateProductStock } from '$lib/api/checkoutApi';
    import { updateStockAfterCheckout } from '$lib/stores/shopItemStore';

    let orderStatus = $state<'loading' | 'success' | 'error'>('loading');
    let errorMessage = $state<string | null>(null);

    onMount(async () => {
        try {
            const sessionId = page.url.searchParams.get('session_id');
            
            if (!sessionId) {
                orderStatus = 'error';
                errorMessage = 'No session ID was found.';
                return;
            }

            const response = await fetch(`/api/verify-payment?session_id=${sessionId}`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to verify payment');
            }
            
            const data = await response.json();
            console.log('Payment verification response:', data);
            
            if (data.success) {
                console.log('Payment verification successful:', data);
                try {
                    if (data.itemsProcessed > 0 && Array.isArray(data.purchasedItems)) {
                        console.log('Updating shop item store with new stock levels');
                        await updateStockAfterCheckout(data.purchasedItems.map((item: {id: number}) => item.id));
                    }
                    
                    await clearCart();
                    console.log('Cart cleared successfully');
                } catch (clearError) {
                    console.error('Error clearing cart or updating stock:', clearError);
                }
                orderStatus = 'success';
            } else {
                orderStatus = 'error';
                errorMessage = 'Payment verification failed.';
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            orderStatus = 'error';
            errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        }
    });

    function goToHome() {
        goto('/');
    }

    function goToAccount() {
        goto('/account');
    }
</script>

<div class="container mx-auto p-4 max-w-2xl">
    <div class="bg-white shadow-md rounded-lg p-8 my-8">
        {#if orderStatus === 'loading'}
            <div class="flex flex-col items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                <p class="text-xl font-medium text-gray-700">Verifying your payment...</p>
            </div>
        {:else if orderStatus === 'success'}
            <div class="text-center py-6">
                <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                    <svg class="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h2 class="text-3xl font-bold text-gray-900 mb-4">Thank you for your order!</h2>
                <p class="text-lg text-gray-600 mb-8">
                    Your payment was successful and your order has been placed.
                </p>
                <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
                    <button onclick={goToHome} class="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg transition-colors">
                        Continue Shopping
                    </button>
                    <button onclick={goToAccount} class="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors">
                        View My Account
                    </button>
                </div>
            </div>
        {:else}
            <div class="text-center py-6">
                <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                    <svg class="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </div>
                <h2 class="text-3xl font-bold text-gray-900 mb-4">Something went wrong</h2>
                <p class="text-lg text-gray-600 mb-2">
                    We couldn't process your payment.
                </p>
                {#if errorMessage}
                    <p class="text-red-500 mb-8">{errorMessage}</p>
                {/if}
                <div class="flex justify-center">
                    <button onclick={goToHome} class="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors">
                        Return Home
                    </button>
                </div>
            </div>
        {/if}
    </div>
</div>
