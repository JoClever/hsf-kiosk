<script>
	import DoclistBtn from "./DoclistBtn.svelte";

	let { activeDoc = $bindable(), activeCat = null } = $props();
        
        let documents = $derived(activeCat ? activeCat.files : {});
</script>

<app-doclist class="w-xs pb-8 flex overflow-y-auto flex-col gap-4">
	{#if !documents || documents.length === 0}
		<div class="text-lg text-stone-500 dark:text-stone-400 italic">Aktuell keine Dateien vorhanden.</div>
	{:else}
                {#each documents as document}
                <DoclistBtn 
                        file_name={document.file_name}
                        display_name={document.display_name}
                        active={activeDoc?.file_name === document.file_name}
                        date={document.date}
                        onclick={() => {activeDoc = document}} />
                {/each}
	{/if}
</app-doclist>