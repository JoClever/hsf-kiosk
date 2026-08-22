import test from 'node:test';
import assert from 'node:assert/strict';

import { filterZammadTickets } from './zammad.js';

test('filterZammadTickets filters by open state, assignee, group, and priority', () => {
	const tickets = [
		{ id: 1, state_id: 1, owner_id: 7, group_id: 3, priority_id: 2, close_at: null, updated_at: '2026-08-20T10:00:00Z' },
		{ id: 2, state_id: 2, owner_id: 7, group_id: 4, priority_id: 1, close_at: null, updated_at: '2026-08-21T10:00:00Z' },
		{ id: 3, state_id: 1, owner_id: 8, group_id: 3, priority_id: 2, close_at: null, updated_at: '2026-08-22T10:00:00Z' },
		{ id: 4, state_id: 1, owner_id: 7, group_id: 3, priority_id: 2, close_at: '2026-08-22T10:00:00Z', updated_at: '2026-08-22T10:00:00Z' }
	];

	const result = filterZammadTickets(tickets, {
		stateIds: [1],
		assigneeIds: [7],
		groupIds: [3],
		priorityIds: [2]
	});

	assert.deepEqual(result.map((ticket) => ticket.id), [1]);
});

test('filterZammadTickets sorts by priority and recency after filtering', () => {
	const tickets = [
		{ id: 1, state_id: 1, owner_id: 7, group_id: 3, priority_id: 3, close_at: null, updated_at: '2026-08-20T10:00:00Z' },
		{ id: 2, state_id: 1, owner_id: 7, group_id: 3, priority_id: 1, close_at: null, updated_at: '2026-08-19T10:00:00Z' },
		{ id: 3, state_id: 1, owner_id: 7, group_id: 3, priority_id: 1, close_at: null, updated_at: '2026-08-21T10:00:00Z' }
	];

	const result = filterZammadTickets(tickets, { stateIds: [1], assigneeIds: [7], groupIds: [3] });

	assert.deepEqual(result.map((ticket) => ticket.id), [3, 2, 1]);
});
