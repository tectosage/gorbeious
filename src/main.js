import './global.css';

import App from './App.svelte';

import {ChronikClient} from 'chronik-client'
const chronik = new ChronikClient("https://node.gorbeious.cash");
globalThis.chronik = chronik


const app = new App({
	target: document.body,
}
);
export default app;
