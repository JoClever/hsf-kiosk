import fetch from 'node-fetch';

import { normalizeDisplayValue, toArray } from '../lib/content-utils.js';

function normalizeIdArray(value) {
	return toArray(value)
		.map((item) => Number(item))
		.filter((item) => Number.isInteger(item));
}

function buildUrl(baseUrl, pathName, query = {}) {
	const url = new URL(pathName, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
	for (const [key, value] of Object.entries(query)) {
		if (value === null || value === undefined || value === '') continue;
		url.searchParams.set(key, String(value));
	}
	return url.toString();
}

function resolveApiBaseUrl(ticketUrl) {
	const normalizedUrl = new URL(ticketUrl);
	if (normalizedUrl.pathname.endsWith('/tickets')) {
		normalizedUrl.pathname = normalizedUrl.pathname.replace(/\/tickets\/?$/, '/');
	}
	return normalizedUrl.toString().replace(/\/$/, '');
}

async function fetchJson(baseUrl, token, pathName, query = {}, fetchImpl = fetch) {
	const response = await fetchImpl(buildUrl(baseUrl, pathName, query), {
		headers: {
			Authorization: `Token token=${token}`
		}
	});

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}

	return await response.json();
}

function normalizePerson(user) {
	if (!user) return null;

	const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ').trim();
	const displayName = fullName || user.name || user.login || user.email || null;

	return {
		id: user.id ?? null,
		display_name: displayName || (user.id !== undefined ? `User ${user.id}` : null),
		email: user.email || null,
		login: user.login || null
	};
}

function formatAgeLabel(dateStr) {
	if (!dateStr) return '-';

	const createdAt = new Date(dateStr);
	if (Number.isNaN(createdAt.getTime())) return '-';

	const diffMs = Date.now() - createdAt.getTime();
	if (diffMs < 0) return '0 Tage';

	const diffDays = Math.floor(diffMs / 86400000);
	if (diffDays <= 0) return '<1 Tag';
	if (diffDays === 1) return '1 Tag';
	return `${diffDays} Tage`;
}

function getTicketSearchText(ticket) {
	return [
		ticket.title,
		ticket.number,
		ticket.state?.name,
		ticket.priority?.name,
		ticket.assignee?.display_name,
		ticket.group?.name,
		ticket.organization?.name,
		ticket.customer?.display_name,
		...(ticket.tags || [])
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();
}

export function filterZammadTickets(tickets, filters = {}) {
	const stateIds = normalizeIdArray(filters.stateIds);
	const assigneeIds = normalizeIdArray(filters.assigneeIds);
	const groupIds = normalizeIdArray(filters.groupIds);
	const priorityIds = normalizeIdArray(filters.priorityIds);
	const search = typeof filters.search === 'string' ? filters.search.trim().toLowerCase() : '';

	return [...tickets]
		.filter((ticket) => {
			if (ticket.close_at) return false;
			if (stateIds.length > 0 && !stateIds.includes(ticket.state_id)) return false;
			if (assigneeIds.length > 0 && !assigneeIds.includes(ticket.owner_id)) return false;
			if (groupIds.length > 0 && !groupIds.includes(ticket.group_id)) return false;
			if (priorityIds.length > 0 && !priorityIds.includes(ticket.priority_id)) return false;
			if (search && !getTicketSearchText(ticket).includes(search)) return false;
			return true;
		})
		.sort((a, b) => {
			const priorityDiff = (a.priority_id ?? Number.MAX_SAFE_INTEGER) - (b.priority_id ?? Number.MAX_SAFE_INTEGER);
			if (priorityDiff !== 0) return priorityDiff;
			return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
		});
}

function buildFilterSummary(entry, lookups) {
	const filters = [];

	const stateIds = normalizeIdArray(entry.state_ids ?? entry.open_state_ids);
	if (stateIds.length > 0) {
		filters.push({
			label: 'Status',
			values: stateIds.map((id) => lookups.states.get(id)?.name || `State ${id}`)
		});
	}

	const assigneeIds = normalizeIdArray(entry.assignee_ids);
	if (assigneeIds.length > 0) {
		filters.push({
			label: 'Zuständig',
			values: assigneeIds.map((id) => lookups.users.get(id)?.display_name || `User ${id}`)
		});
	}

	const groupIds = normalizeIdArray(entry.group_ids);
	if (groupIds.length > 0) {
		filters.push({
			label: 'Gruppe',
			values: groupIds.map((id) => lookups.groups.get(id)?.name || `Group ${id}`)
		});
	}

	const priorityIds = normalizeIdArray(entry.priority_ids);
	if (priorityIds.length > 0) {
		filters.push({
			label: 'Priorität',
			values: priorityIds.map((id) => lookups.priorities.get(id)?.name || `Priority ${id}`)
		});
	}

	if (typeof entry.search === 'string' && entry.search.trim()) {
		filters.push({
			label: 'Suche',
			values: [entry.search.trim()]
		});
	}

	return filters;
}

function normalizeTicket(ticket, lookups, tagList) {
	const state = lookups.states.get(ticket.state_id) || null;
	const priority = lookups.priorities.get(ticket.priority_id) || null;
	const assignee = lookups.users.get(ticket.owner_id) || null;
	const group = lookups.groups.get(ticket.group_id) || null;
	const organization = lookups.organizations.get(ticket.organization_id) || null;
	const customer = lookups.customers.get(ticket.customer_id) || null;

	return {
		id: ticket.id,
		number: ticket.number || null,
		title: ticket.title || 'Ohne Titel',
		status: normalizeDisplayValue(state, ticket.state_id !== undefined ? `State ${ticket.state_id}` : null),
		priority: normalizeDisplayValue(priority, ticket.priority_id !== undefined ? `Priority ${ticket.priority_id}` : null),
		assignee: normalizeDisplayValue(assignee, ticket.owner_id !== undefined ? `User ${ticket.owner_id}` : null),
		project: normalizeDisplayValue(group, ticket.group_id !== undefined ? `Group ${ticket.group_id}` : null),
		group: normalizeDisplayValue(group, ticket.group_id !== undefined ? `Group ${ticket.group_id}` : null),
		organization: normalizeDisplayValue(organization, ticket.organization_id !== undefined ? `Organization ${ticket.organization_id}` : null),
		customer: normalizeDisplayValue(customer, ticket.customer_id !== undefined ? `Customer ${ticket.customer_id}` : null),
		tags: tagList,
		article_count: ticket.article_count ?? null,
		created_at: ticket.created_at || null,
		updated_at: ticket.updated_at || null,
		age_label: formatAgeLabel(ticket.created_at),
		raw_status_id: ticket.state_id ?? null,
		raw_priority_id: ticket.priority_id ?? null,
		raw_group_id: ticket.group_id ?? null,
		raw_owner_id: ticket.owner_id ?? null,
		raw_organization_id: ticket.organization_id ?? null
	};
}

async function fetchLookupMap(baseUrl, token, resource, ids, fetchImpl = fetch) {
	const map = new Map();

	await Promise.all(
		ids.map(async (id) => {
			try {
				const item = await fetchJson(baseUrl, token, `${resource}/${id}`, {}, fetchImpl);
				map.set(id, resource === 'users' ? normalizePerson(item) : item);
			} catch (error) {
				map.set(id, null);
			}
		})
	);

	return map;
}

async function fetchTicketTags(baseUrl, token, ticketId, fetchImpl = fetch) {
	try {
		const data = await fetchJson(baseUrl, token, 'tags', { object: 'Ticket', o_id: ticketId }, fetchImpl);
		return Array.isArray(data?.tags) ? data.tags : [];
	} catch (error) {
		return [];
	}
}

export async function fetchZammadTickets(entry, fetchImpl = fetch) {
	try {
		const ticketUrl = entry.url;
		const ticketToken = entry.token;

		if (!ticketUrl) {
			return {
				source_name: entry.source_name || entry.display_name,
				tickets: [],
				error: 'Ticket URL not configured'
			};
		}

		if (!ticketToken) {
			return {
				source_name: entry.source_name || entry.display_name,
				tickets: [],
				error: 'Ticket token not configured'
			};
		}

		const apiBaseUrl = resolveApiBaseUrl(ticketUrl);
		const apiTickets = await fetchJson(apiBaseUrl, ticketToken, 'tickets', {}, fetchImpl);
		const tickets = Array.isArray(apiTickets) ? apiTickets : [];
		const filteredTickets = filterZammadTickets(tickets, {
			stateIds: entry.state_ids ?? entry.open_state_ids,
			assigneeIds: entry.assignee_ids,
			groupIds: entry.group_ids,
			priorityIds: entry.priority_ids,
			search: entry.search
		});
		const limitedTickets = filteredTickets.slice(0, entry.limit || 25);

		const uniqueStateIds = [...new Set(limitedTickets.map((ticket) => ticket.state_id).filter((id) => Number.isInteger(id)))];
		const uniquePriorityIds = [...new Set(limitedTickets.map((ticket) => ticket.priority_id).filter((id) => Number.isInteger(id)))];
		const uniqueOwnerIds = [...new Set(limitedTickets.map((ticket) => ticket.owner_id).filter((id) => Number.isInteger(id)))];
		const uniqueGroupIds = [...new Set(limitedTickets.map((ticket) => ticket.group_id).filter((id) => Number.isInteger(id)))];
		const uniqueOrganizationIds = [...new Set(limitedTickets.map((ticket) => ticket.organization_id).filter((id) => Number.isInteger(id)))];
		const uniqueCustomerIds = [...new Set(limitedTickets.map((ticket) => ticket.customer_id).filter((id) => Number.isInteger(id)))];

		const [states, priorities, users, groups, organizations, customers] = await Promise.all([
			fetchLookupMap(apiBaseUrl, ticketToken, 'ticket_states', uniqueStateIds, fetchImpl),
			fetchLookupMap(apiBaseUrl, ticketToken, 'ticket_priorities', uniquePriorityIds, fetchImpl),
			fetchLookupMap(apiBaseUrl, ticketToken, 'users', uniqueOwnerIds, fetchImpl),
			fetchLookupMap(apiBaseUrl, ticketToken, 'groups', uniqueGroupIds, fetchImpl),
			fetchLookupMap(apiBaseUrl, ticketToken, 'organizations', uniqueOrganizationIds, fetchImpl),
			fetchLookupMap(apiBaseUrl, ticketToken, 'users', uniqueCustomerIds, fetchImpl)
		]);

		const lookups = {
			states: new Map(states),
			priorities: new Map(priorities),
			users: new Map(users),
			groups: new Map(groups),
			organizations: new Map(organizations),
			customers: new Map(customers)
		};

		const ticketEntries = await Promise.all(
			limitedTickets.map(async (ticket) => {
				const tags = await fetchTicketTags(apiBaseUrl, ticketToken, ticket.id, fetchImpl);
				return normalizeTicket(ticket, lookups, tags);
			})
		);

		return {
			source_name: entry.source_name || entry.display_name,
			filters: buildFilterSummary(entry, lookups),
			tickets: ticketEntries
		};
	} catch (error) {
		console.error(`Zammad ${entry.display_name} error:`, error);
		return {
			source_name: entry.source_name || entry.display_name,
			tickets: [],
			error: error.message
		};
	}
}
