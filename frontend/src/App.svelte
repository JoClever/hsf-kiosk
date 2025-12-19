<script>
	// Importing components
	import Header from "./lib/Header.svelte";
	import Navigation from "./lib/Navigation.svelte";
	import FilesFrame from "./lib/FilesFrame.svelte";
	import IFrame from "./lib/IFrame.svelte";
	import CalendarFrame from "./lib/CalendarFrame.svelte";
	import EmptyFrame from "./lib/EmptyFrame.svelte";
	import ErrorFrame from "./lib/ErrorFrame.svelte";
	import ScreenSaver from "./lib/ScreenSaver.svelte";
	import {fetchJSON} from "./lib/utils.js";

	let fetchFiles = $state(fetchJSON("navigation"));
	
	let activeCat = $state(null);
	let activeDoc = $state(null);

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
			{#each categories as category}
				{#if category.type === "iframe"}
					<IFrame title={category.display_name} url={category.url} active={activeCat?.display_name === category.display_name} />
				{/if}
				{#if category.type === "calendar"}
					{#if activeCat?.display_name === category.display_name}
						<CalendarFrame page={category} />
					{/if}
				{/if}
			{/each}
			{#if activeCat === null}
				<EmptyFrame />
			{/if}
			{#if activeCat?.type === "documents"}
				<FilesFrame {activeCat} bind:activeDoc />
			{/if}
		{:catch error}
			<ErrorFrame message={"Fehler beim Laden der Dateien: " + error.message} />
		{/await}
	</main>
	<ScreenSaver {idle} onInteraction={resetInactivityTimer} />
</div>
