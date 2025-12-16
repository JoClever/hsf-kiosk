<script>
    let { title = "", url = "", active = false } = $props();
</script>

<iframe title={title} class="flex-auto w-full h-full {active ? "" : "hidden"}" src={url} frameborder="0"></iframe>