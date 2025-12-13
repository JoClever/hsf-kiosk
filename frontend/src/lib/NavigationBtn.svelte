<script>
	let { category, active = false, onclick } = $props();

	let classes = $derived(`flex size-16 p-2 rounded-lg transition duration-300 ${active ? "bg-red-900 dark:bg-stone-600" : ""}`);
</script>

<button class={classes} aria-pressed={active} {onclick}>
	<img class="" src="/assets/{category}.png" alt={category} />
</button>
