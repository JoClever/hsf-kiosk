<script lang="ts">
	let {
		idle = false,
		onInteraction = (_event: Event) => {}
	}: {
		idle?: boolean;
		onInteraction?: (event: Event) => void;
	} = $props();
	const screensaverUrl = import.meta.env.VITE_SCREENSAVER_URL || "/screensaver/";
</script>

<div class="absolute top-0 left-0 w-dvw h-dvh z-50 {idle ? "" : "hidden"}">
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