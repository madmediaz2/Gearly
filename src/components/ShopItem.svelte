<script lang="ts">
	import Button from "./ui/Button.svelte";

	interface Props {
		image: string;
		brand: string;
		name: string;
		price: number;
		onAddToCart: () => void;
	}

	let { image, brand, name, price, onAddToCart }: Props = $props();
</script>

<article class="border border-gray-200 rounded-lg overflow-hidden w-3xs flex flex-col bg-white shadow-md">
    <figure class="h-44 flex justify-center items-center p-4 bg-white">
        <img src={image} alt={name} class="max-w-full max-h-full object-contain" />
    </figure>

    <div class="p-3 px-4">
        <header class="flex flex-col gap-0.5">
			<p class="text-lg font-medium text-gray-800">{name}</p>
			<h3 class="text-base font-normal text-gray-600 mb-3">{brand}</h3>
		</header>

        <footer class="flex justify-between items-center mt-1">
            <div class="text-lg font-bold text-black">€{price}</div>
            <Button variant="cart-item" onclick={onAddToCart} >
                <span class="mr-1 text-[10px]" aria-hidden="true">➤</span>
				<span>Winkelmandje</span>
            </Button>
        </footer>
    </div>
</article>
