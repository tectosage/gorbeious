import { writable } from 'svelte/store';

export const greeted = writable(false);
export const mnemonic = writable();
export const keyringArray = writable();
export const transactionPromise = writable();
export const funds = writable(0);
export const coins = writable([]);
export const tokenCoins = writable({});
export const reservedCoins = writable([]);
export const reservedTokenCoins = writable({});
export const tokenRecords = writable({});
export const tokenFunds = writable({});
export const tokenUTXO = writable(0);
export const historyArray = writable([])
export const promise = writable() // coins promise
export const view = writable('home')
export const signals = writable([])
export const payments = writable([])
export const websocket = writable() // for the SWAP websocket!!
export const price = writable()
export const onCooldown = writable(false)
export const copied = writable('')
export const reloading = writable(false)
export const isMobile = writable(false)
export const loaded = writable(false)