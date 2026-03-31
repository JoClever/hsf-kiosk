<script>
	let { page } = $props();

	function formatDateShort(dateStr) {
		if (!dateStr) return "-";
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) return "-";

		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		return `${day}.${month}.${year}`;
	}
</script>

<app-contentframe class="flex-auto p-8 pr-0 pb-0 flex flex-col gap-8 bg-stone-100 dark:bg-stone-900">
	<h1 class="text-4xl text-red-900 dark:text-red-900 font-bold">{page?.display_name}</h1>

	<div class="flex-auto overflow-y-auto pr-8 pb-8">
		{#if page?.error}
			<div class="text-orange-600 dark:text-orange-400 italic">
				Fehler: {page.error}
			</div>
		{:else if !page?.tickets || page.tickets.length === 0}
			<div class="text-lg text-stone-500 dark:text-stone-400 italic">
				Keine offenen Tickets.
			</div>
		{:else}
			<div class="space-y-3">
				{#each page.tickets as ticket}
					<div class="bg-white dark:bg-stone-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
						<div class="flex justify-between items-start gap-4">
							<div class="flex-1">
								<h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100">
									{ticket.title}
								</h3>
								<div class="mt-2 text-sm text-stone-700 dark:text-stone-300 flex flex-wrap gap-x-4 gap-y-1">
									<span><strong>Status:</strong> {ticket.status || "-"}</span>
									<span><strong>Prioritat:</strong> {ticket.priority || "-"}</span>
									<span><strong>Zustandig:</strong> {ticket.assignee || "-"}</span>
									<span><strong>Projekt:</strong> {ticket.project || "-"}</span>
								</div>
							</div>
							<div class="text-right shrink-0 text-sm text-stone-600 dark:text-stone-300">
								<div class="font-medium text-red-900 dark:text-red-700">#{ticket.number || ticket.id}</div>
								<div>Erstellt: {formatDateShort(ticket.created_at)}</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</app-contentframe>
