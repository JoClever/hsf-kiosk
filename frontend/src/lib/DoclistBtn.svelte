<script>
	let { file_name, display_name = null, date = "unbekannt", active = false, onclick } = $props();

	let name = $derived.by(() => {
		let dispName = display_name ? display_name : file_name;
		// remove known file extensions for better display
		return dispName.replace(/\.(pdf|jpg|jpeg|png|gif)$/i,"");
	});

	let classes = $derived(`box-content flex-none h-12 px-4 py-4 text-left flex flex-col justify-between rounded-xl transition duration-300 border-l-[.125rem] ${active ? "bg-white dark:bg-stone-600 border-red-900 dark:border-red-600" : "bg-stone-200 dark:bg-stone-800 border-transparent"}`);
</script>

<button class={classes} aria-pressed={active} {onclick}>
	<div class="text-lg text-red-900 dark:text-red-600 font-medium">{name}</div>
	<div class="text-xs text-stone-500 dark:text-stone-400">{date}</div>
</button>
