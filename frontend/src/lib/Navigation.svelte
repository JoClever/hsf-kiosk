<script>
	import NavigationBtn from "./NavigationBtn.svelte";

	let { activeCat = $bindable(null), activeDoc = $bindable(null), categories = []} = $props();

	let changeCat = (cat) => {
		activeCat = cat;
		activeDoc = null;
	};
</script>

<nav class="w-min flex-none py-8 px-4 flex flex-col gap-4">
	{#each categories as category}
		<NavigationBtn category={category.display_name} active={activeCat?.display_name === category.display_name} onclick={()=>changeCat(category)} />
	{/each}
</nav>
