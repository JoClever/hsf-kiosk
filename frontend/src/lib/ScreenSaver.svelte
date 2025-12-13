<script>
	let { idle = false } = $props();
</script>

{#if idle}
	<div class="absolute top-0 left-0 w-dvw h-dvh z-50">
		<!-- <video autoplay muted loop class="w-full h-full object-cover">
			<source src="/assets/HSF-Imagefilm 2019.mp4" type="video/mp4" />
			Your browser does not support the video tag.
		</video> -->
		<img
			src="/assets/Gerhard-Chefkoch.png"
			alt="Screensaver"
			class="w-full h-full object-cover"
		/>
	</div>
{/if}