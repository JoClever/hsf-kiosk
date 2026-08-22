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

	function formatDateTimeShort(dateStr) {
		if (!dateStr) return "-";
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) return "-";

		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${day}.${month}.${year} ${hours}:${minutes}`;
	}
</script>

<app-contentframe class="flex-auto p-8 pr-0 pb-0 flex flex-col gap-8 bg-stone-100 dark:bg-stone-900">
	<h1 class="text-4xl text-red-900 dark:text-red-900 font-bold">{page?.display_name}</h1>

	<!--{#if page?.source_name || page?.filters?.length}
		<div class="flex flex-wrap items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
 			{#if page?.source_name}
				<span class="rounded-full bg-stone-200 dark:bg-stone-700 px-3 py-1 font-medium">
					Quelle: {page.source_name}
				</span>
			{/if}
			{#each page.filters ?? [] as filter}
				<span class="rounded-full bg-red-100 dark:bg-red-900/40 px-3 py-1">
					<strong>{filter.label}:</strong> {filter.values.join(', ')}
				</span>
			{/each}
		</div>
	{/if} -->

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
								<div class="mt-2 text-xs text-stone-700 dark:text-stone-300 flex flex-wrap gap-x-4 gap-y-1">
									<span class="rounded-full bg-red-100 dark:bg-red-900/40 px-3 py-1"><strong>Status:</strong> {ticket.status || "-"}</span>
									<span class="rounded-full bg-red-100 dark:bg-red-900/40 px-3 py-1"><strong>Priorität:</strong> {ticket.priority || "-"}</span>
									<span class="rounded-full bg-red-100 dark:bg-red-900/40 px-3 py-1"><strong>Zuständig:</strong> {ticket.assignee || "-"}</span>
									<span class="rounded-full bg-red-100 dark:bg-red-900/40 px-3 py-1"><strong>Kommentare:</strong> {ticket.article_count ?? "-"}</span>
									<span class="rounded-full bg-red-100 dark:bg-red-900/40 px-3 py-1"><strong>Alter:</strong> {ticket.age_label || "-"}</span>
								</div>
								{#if ticket.tags?.length}
									<div class="mt-3 flex flex-wrap gap-2 text-xs text-stone-600 dark:text-stone-300">
										{#each ticket.tags as tag}
											<span class="rounded-full bg-stone-200 dark:bg-stone-600 px-3 py-1">#{tag}</span>
										{/each}
									</div>
								{/if}
							</div>
							<div class="text-right shrink-0 text-sm text-stone-600 dark:text-stone-300">
								<div class="font-medium text-red-900 dark:text-red-700">#{ticket.number || ticket.id}</div>
								<div>Erstellt: {formatDateShort(ticket.created_at)}</div>
								<div>Aktualisiert: {formatDateTimeShort(ticket.updated_at)}</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</app-contentframe>
