<script>
	let { idle = false, onInteraction = () => {} } = $props();
	const screensaverUrl = import.meta.env.VITE_SCREENSAVER_URL || "/screensaver/";
</script>

{#if idle}
	<div class="absolute top-0 left-0 w-dvw h-dvh z-50">
		<iframe
			title="MagicMirror2"
			src={screensaverUrl}
			class="w-full h-full"
			frameborder="0"
			allowfullscreen
		></iframe>
		<!-- Transparentes Overlay, um Events abzufangen -->
		<div 
			class="absolute top-0 left-0 w-full h-full cursor-default"
			onmousemove={onInteraction}
			ontouchstart={onInteraction}
			role="button"
			tabindex="0"
			aria-label="Screensaver beenden"
		></div>
	</div>
{/if}