<script>
	let { page } = $props();
	
	// Calendar data is already in page.calendars (loaded by /api/navigation)
	// No need to fetch separately anymore
	
	function formatDate(dateStr) {
		const date = new Date(dateStr);
		const day = date.getDate();
		const monthNames = [
			"Januar", "Februar", "März", "April", "Mai", "Juni",
			"Juli", "August", "September", "Oktober", "November", "Dezember"
		];
		const month = monthNames[date.getMonth()];
		const year = date.getFullYear();
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		
		return `${day}. ${month} ${year}, ${hours}:${minutes} Uhr`;
	}
	
	function formatDateShort(dateStr) {
		const date = new Date(dateStr);
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		
		return `${day}.${month}. ${hours}:${minutes}`;
	}
</script>

<app-contentframe class="flex-auto p-8 pr-0 pb-0 flex flex-col gap-8 bg-stone-100 dark:bg-stone-900">
	<h1 class="text-4xl text-red-900 dark:text-red-900 font-bold">{page?.display_name}</h1>
	
	<div class="flex-auto overflow-y-auto pr-8 pb-8">
		{#if !page?.calendars || page.calendars.length === 0}
			<div class="text-lg text-stone-500 dark:text-stone-400 italic">
				Keine Kalender konfiguriert.
			</div>
		{:else}
			{#each page.calendars as calendar}
				<div class="mb-8">
					<h2 class="text-2xl font-bold text-red-800 dark:text-red-700 mb-4">
						{calendar.name}
					</h2>
					
					{#if calendar.error}
						<div class="text-orange-600 dark:text-orange-400 italic">
							Fehler: {calendar.error}
						</div>
					{:else if !calendar.events || calendar.events.length === 0}
						<div class="text-stone-500 dark:text-stone-400 italic">
							Keine anstehenden Termine.
						</div>
					{:else}
						<div class="space-y-3">
							{#each calendar.events as event}
								<div class="bg-white dark:bg-stone-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
									<div class="flex justify-between items-start gap-4">
										<div class="flex-1">
											<h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100">
												{event.summary}
											</h3>
											{#if event.location}
												<div class="text-sm text-stone-600 dark:text-stone-400 mt-1">
													📍 {event.location}
												</div>
											{/if}
										</div>
										<div class="text-right flex-shrink-0">
											<div class="text-sm font-medium text-red-900 dark:text-red-700">
												{formatDateShort(event.start)}
											</div>
											{#if event.end}
												<div class="text-xs text-stone-500 dark:text-stone-400">
													bis {formatDateShort(event.end)}
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</app-contentframe>


