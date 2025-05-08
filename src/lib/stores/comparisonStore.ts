

import { writable, derived, get } from 'svelte/store';
import type { ProductItem } from '$lib/types/supabaseTypes';
import { browser } from '$app/environment';

type ComparisonState = {
    items: ProductItem[];
    maxItems: number;
};

const initialState: ComparisonState = {
    items: [],
    maxItems: 3
};

const createComparisonStore = () => {
    const storedItems = browser && localStorage.getItem('comparisonItems');
    const initialItems = storedItems ? JSON.parse(storedItems) : initialState;
    const { subscribe, update, set } = writable<ComparisonState>(initialItems);

    return {
        subscribe,
        addToComparison: (product: ProductItem): boolean => {
            const store = get({ subscribe });
            if (store.items.some(item => item.id === product.id)) {
                return false; // Item already in comparison
            }
            if (store.items.length >= store.maxItems) {
                return false;
            }
            update(state => {
                const updatedState = {
                    ...state,
                    items: [...state.items, product]
                };
                if (browser) {
                    localStorage.setItem('comparisonItems', JSON.stringify(updatedState));
                }
                return updatedState;
            });
            return true;
        },
        removeFromComparison: (productId: number) => {
            update(state => {
                const updatedState = {
                    ...state,
                    items: state.items.filter(item => item.id !== productId)
                };
                if (browser) {
                    localStorage.setItem('comparisonItems', JSON.stringify(updatedState));
                }
                return updatedState;
            });
        },
        clearComparison: () => {
            set(initialState);
            if (browser) {
                localStorage.setItem('comparisonItems', JSON.stringify(initialState));
            }
        },
        isInComparison: (productId: number): boolean => {
            const store = get({ subscribe });
            return store.items.some(item => item.id === productId);
        },
        isComparisonFull: (): boolean => {
            const store = get({ subscribe });
            return store.items.length >= store.maxItems;
        }
    };
};

export const comparisonStore = createComparisonStore();

export const comparisonCount = derived(
    comparisonStore,
    $comparisonStore => $comparisonStore.items.length
);
