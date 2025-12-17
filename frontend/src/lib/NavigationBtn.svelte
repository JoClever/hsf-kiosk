<script>
	let { category = null, icon = null, active = false, onclick } = $props();

	let classes = $derived(`flex size-16 p-2 rounded-lg transition-all ease-in-out duration-300 ${active ? "border-red-900 dark:border-stone-600 dark:bg-stone-600 border-4" : "border-transparent"}`);
</script>

<button class={classes} aria-pressed={active} {onclick}>
	<img class="" src="/assets/icons/{icon}.svg" alt={category} />
</button>
