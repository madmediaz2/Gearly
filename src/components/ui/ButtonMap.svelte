<script lang="ts">
    import Button from './Button.svelte';
</script>

<div class="p-6 bg-white shadow-md rounded-lg">
    <h1 class="text-2xl font-bold mb-6">Button Component UI Map</h1>
    
    <div class="space-y-8">
        <!-- Default Button Variants -->
        <div>
            <h2 class="text-xl font-semibold mb-3">Default Variant</h2>
            <div class="flex flex-wrap gap-4">
                <div class="flex flex-col items-center">
                    <Button variant="default">Default Button</Button>
                    <span class="text-sm text-gray-500 mt-2">Default Size</span>
                </div>
                <div class="flex flex-col items-center">
                    <Button variant="default" size="sm">Small Button</Button>
                    <span class="text-sm text-gray-500 mt-2">Small Size</span>
                </div>
                <div class="flex flex-col items-center">
                    <Button variant="default" size="lg">Large Button</Button>
                    <span class="text-sm text-gray-500 mt-2">Large Size</span>
                </div>
                <div class="flex flex-col items-center">
                    <Button variant="default" disabled>Disabled Button</Button>
                    <span class="text-sm text-gray-500 mt-2">Disabled</span>
                </div>
            </div>
        </div>
        
        <!-- Icon Button Variants -->
        <div>
            <h2 class="text-xl font-semibold mb-3">Icon Variant</h2>
            <div class="flex flex-wrap gap-4">
                <div class="flex flex-col items-center">
                    <Button variant="icon">
                        <img src="/shopping_cart.svg" alt="Shopping Cart" class="w-10 h-10" />
                    </Button>
                    <span class="text-sm text-gray-500 mt-2">Shopping Cart</span>
                </div>
                <div class="flex flex-col items-center">
                    <Button variant="icon">
                        <img src="/avatar.svg" alt="Avatar" class="w-10 h-10" />
                    </Button>
                    <span class="text-sm text-gray-500 mt-2">Avatar</span>
                </div>
                <div class="flex flex-col items-center">
                    <Button variant="icon" disabled>
                        <img src="/menu.svg" alt="Menu" class="w-10 h-10" />
                    </Button>
                    <span class="text-sm text-gray-500 mt-2">Disabled Icon</span>
                </div>
            </div>
        </div>
        
        <!-- Footer Button Variants -->
        <div>
            <h2 class="text-xl font-semibold mb-3">Footer Variant</h2>
            <div class="flex flex-wrap gap-4 bg-gray-100 p-3 rounded">
                <div class="flex flex-col items-center">
                    <Button variant="footer">
                        <img src="/Twitter.svg" alt="Twitter" class="w-6 h-6" />
                    </Button>
                    <span class="text-sm text-gray-500 mt-2">Twitter</span>
                </div>
                <div class="flex flex-col items-center">
                    <Button variant="footer">
                        <img src="/Instagram.svg" alt="Instagram" class="w-6 h-6" />
                    </Button>
                    <span class="text-sm text-gray-500 mt-2">Instagram</span>
                </div>
            </div>
        </div>
        
        <!-- Navigation Button Variants -->
        <div>
            <h2 class="text-xl font-semibold mb-3">Navigation Variant</h2>
            <div class="flex flex-wrap gap-4 bg-gray-100 p-3 rounded">
                <div class="flex flex-col items-center">
                    <Button variant="navigation">
                        <div class="flex flex-row items-center gap-1">
                            <img src="/menu.svg" alt="menu" class="w-5 h-5" />
                            <span>Categories</span>
                        </div>
                    </Button>
                    <span class="text-sm text-gray-500 mt-2">With Icon</span>
                </div>
                <div class="flex flex-col items-center">
                    <Button variant="navigation">Laptops</Button>
                    <span class="text-sm text-gray-500 mt-2">Text Only</span>
                </div>
            </div>
        </div>
        
        <!-- Custom Classes -->
        <div>
            <h2 class="text-xl font-semibold mb-3">Custom Styling</h2>
            <div class="flex flex-wrap gap-4">
                <div class="flex flex-col items-center">
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                        Primary Button
                    </Button>
                    <span class="text-sm text-gray-500 mt-2">Custom Primary</span>
                </div>
                <div class="flex flex-col items-center">
                    <Button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                        Danger Button
                    </Button>
                    <span class="text-sm text-gray-500 mt-2">Custom Danger</span>
                </div>
                <div class="flex flex-col items-center">
                    <Button className="border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded">
                        Secondary Button
                    </Button>
                    <span class="text-sm text-gray-500 mt-2">Custom Secondary</span>
                </div>
            </div>
        </div>
    </div>
</div>