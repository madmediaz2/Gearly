import { writable } from 'svelte/store';

export const sheetOpenStore = writable<boolean>(false);