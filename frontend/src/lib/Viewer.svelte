<script>
	let { activeDoc = null } = $props();
</script>

<app-viewbox class="flex-auto overflow-hidden flex flex-col items-center justify-around bg-white dark:bg-stone-600 rounded-t-2xl">
	{#if !activeDoc}
		<img class="size-96" src="https://www.hsf-ev.de/files/20221102_hsf_logo-header.svg" alt="HSF-Logo" />
    {:else if activeDoc.file_name.endsWith('.pdf')}
        <iframe title="{activeDoc.file_name}" class="flex-auto w-full h-full" src={activeDoc ? activeDoc.path : ''} frameborder="0"></iframe>
    {:else if activeDoc.file_name.endsWith('.jpg') || activeDoc.file_name.endsWith('.jpeg') || activeDoc.file_name.endsWith('.png') || activeDoc.file_name.endsWith('.gif')}
        <img class="h-full w-full object-contain" src={activeDoc ? activeDoc.path : ''} alt={activeDoc ? activeDoc.file_name : 'Dokument'} />
	{:else}
		<div class="text-lg text-stone-500 dark:text-stone-400 italic">Dateityp nicht unterstützt.</div>
	{/if}
</app-viewbox>
