<script>
	// Importing components
	import Header from "./lib/Header.svelte";
	import Navigation from "./lib/Navigation.svelte";
	import Doclist from "./lib/Doclist.svelte";
	import Viewer from "./lib/Viewer.svelte";
	import ScreenSaver from "./lib/ScreenSaver.svelte";
	import {fetchJSON} from "./lib/utils.js";

	let fetchFiles = $state(fetchJSON("files"));
	
	let activeCat = $state(null);
	let activeDoc = $state(null);

	let website = $derived(activeCat?.display_name === "HSF-Website");
	let netzmap = $derived(activeCat?.display_name === "Netzmap");

	let lastInteraction = Date.now();

	let idle = $state(false);
	let resetInactivityTimer = () => {
		lastInteraction = Date.now();
	};

	const checkInactivity = setInterval(() => {
		idle = (Date.now() - lastInteraction > 180 * 1000);
	}, 1000);

	window.addEventListener("mousemove", resetInactivityTimer);
	window.addEventListener("touchstart", resetInactivityTimer);
</script>

<div class="w-dvw h-dvh flex flex-col bg-red-900 dark:bg-red-900">
	<Header />
	<main class="h-full flex flex-row bg-white dark:bg-stone-800 rounded-t-3xl overflow-hidden">
		{#await fetchFiles then categories} 
			<Navigation {categories} bind:activeCat bind:activeDoc />
				<iframe title="Netzmap" class="flex-auto w-full h-full {netzmap ? "" : "hidden"}" src="https://halle.netzmap.com/app" frameborder="0"></iframe>
			{#if website}
				<iframe title="HSF-Website" class="flex-auto w-full h-full" src="/hsf" frameborder="0"></iframe>
			{:else if !netzmap && !website}
				<app-contentframe class="flex-auto p-8 pr-0 pb-0 flex flex-col gap-8 bg-stone-100 dark:bg-stone-900">
					<h1 class="text-4xl text-red-900 dark:text-red-900 font-bold">{activeCat?.display_name}</h1>
					<app-content class="flex-auto min-h-0 gap-8 flex flex-row">
						<Doclist {activeCat} bind:activeDoc />
						<Viewer {activeDoc} />
					</app-content>
				</app-contentframe>
			{/if}
		{:catch error}
			<div class="flex-auto flex items-center justify-center text-lg text-stone-500 dark:text-stone-400 italic">
				Fehler beim Laden der Dateien: {error.message}
			</div>
		{/await}
		
	</main>
	<ScreenSaver {idle} />
</div>
