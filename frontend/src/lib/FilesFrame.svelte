<script>
    import Doclist from "./Doclist.svelte";
    import Viewer from "./Viewer.svelte";

    let { activeCat = $bindable(null), activeDoc = $bindable(null)} = $props();
</script>


<app-contentframe class="flex-auto p-8 pr-0 pb-0 flex flex-col gap-8 bg-stone-100 dark:bg-stone-900">
    <h1 class="text-4xl text-red-900 dark:text-red-900 font-bold">{activeCat?.display_name}</h1>
    <app-content class="flex-auto min-h-0 gap-8 flex flex-row">
        <Doclist {activeCat} bind:activeDoc />
        <Viewer {activeDoc} />
    </app-content>
</app-contentframe>