import test from 'node:test';
import assert from 'node:assert/strict';

import { flattenCalendarEvents } from './calendar.js';

test('flattenCalendarEvents merges all events and keeps the source calendar name', () => {
	const merged = flattenCalendarEvents([
		{
			name: 'Kita',
			events: [
				{ summary: 'A', start: '2026-08-20T10:00:00Z', end: '2026-08-20T11:00:00Z' },
				{ summary: 'B', start: '2026-08-22T09:00:00Z', end: '2026-08-22T10:00:00Z' }
			]
		},
		{
			name: 'Verein',
			events: [
				{ summary: 'C', start: '2026-08-21T08:00:00Z', end: '2026-08-21T09:00:00Z' }
			]
		},
		{ name: 'Broken', error: 'Oh no', events: [] }
	]);

	assert.deepEqual(
		merged.map((event) => ({ summary: event.summary, calendar: event.calendar })),
		[
			{ summary: 'A', calendar: 'Kita' },
			{ summary: 'C', calendar: 'Verein' },
			{ summary: 'B', calendar: 'Kita' }
		]
	);
});
