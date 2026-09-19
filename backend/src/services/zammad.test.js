import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchZammadTickets, filterZammadTickets } from './zammad.js';

test('fetchZammadTickets resolves URL and token from environment variables', async () => {
	const previousUrl = process.env.TEST_ZAMMAD_URL;
	const previousToken = process.env.TEST_ZAMMAD_TOKEN;
	process.env.TEST_ZAMMAD_URL = 'https://zammad.example.test/api/v1';
	process.env.TEST_ZAMMAD_TOKEN = 'test-token';

	const requests = [];
	const fetchImpl = async (url, options) => {
		requests.push({ url, options });
		return {
			ok: true,
			json: async () => []
		};
	};

	try {
		const result = await fetchZammadTickets(
			{ source_name: 'Test', url_env: 'TEST_ZAMMAD_URL', token_env: 'TEST_ZAMMAD_TOKEN' },
			fetchImpl
		);

		assert.deepEqual(result.tickets, []);
		assert.equal(requests[0].url, 'https://zammad.example.test/api/v1/tickets');
		assert.equal(requests[0].options.headers.Authorization, 'Token token=test-token');
	} finally {
		if (previousUrl === undefined) delete process.env.TEST_ZAMMAD_URL;
		else process.env.TEST_ZAMMAD_URL = previousUrl;
		if (previousToken === undefined) delete process.env.TEST_ZAMMAD_TOKEN;
		else process.env.TEST_ZAMMAD_TOKEN = previousToken;
	}
});

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
