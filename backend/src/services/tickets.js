import fetch from 'node-fetch';

import { normalizeDisplayValue, toArray } from '../lib/content-utils.js';

function normalizeTicket(ticket) {
	return {
		id: ticket.id,
		number: ticket.number || null,
		title: ticket.title || 'Ohne Titel',
		status: normalizeDisplayValue(ticket.state, ticket.state_id !== undefined ? `State ${ticket.state_id}` : null),
		priority: normalizeDisplayValue(ticket.priority, ticket.priority_id !== undefined ? `Priority ${ticket.priority_id}` : null),
		assignee: normalizeDisplayValue(ticket.owner, ticket.owner_id !== undefined ? `User ${ticket.owner_id}` : null),
		project: normalizeDisplayValue(
			ticket.bereich || ticket.group || ticket.organization || ticket.ticket_typ,
			ticket.group_id !== undefined ? `Group ${ticket.group_id}` : null
		),
		created_at: ticket.created_at || null,
		updated_at: ticket.updated_at || null,
		raw_status_id: ticket.state_id ?? null,
		raw_priority_id: ticket.priority_id ?? null
	};
}

function isOpenTicket(ticket, openStateIds = []) {
	if (ticket.close_at) return false;
	if (openStateIds.length === 0) return true;
	if (ticket.state_id === null || ticket.state_id === undefined) return false;
	return openStateIds.includes(ticket.state_id);
}

export async function fetchTickets(entry) {
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

		const response = await fetch(ticketUrl, {
			headers: {
				Authorization: `Token token=${ticketToken}`
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const data = await response.json();
		const openStateIds = toArray(entry.open_state_ids)
			.map((id) => Number(id))
			.filter((id) => Number.isInteger(id));
		const apiTickets = Array.isArray(data) ? data : [];

		const tickets = apiTickets
			.filter((ticket) => isOpenTicket(ticket, openStateIds))
			.sort((a, b) => {
				const p = (a.priority_id ?? Number.MAX_SAFE_INTEGER) - (b.priority_id ?? Number.MAX_SAFE_INTEGER);
				if (p !== 0) return p;
				return new Date(b.created_at || 0) - new Date(a.created_at || 0);
			})
			.slice(0, entry.limit || 25)
			.map(normalizeTicket);

		return {
			source_name: entry.source_name || entry.display_name,
			tickets
		};
	} catch (error) {
		console.error(`Tickets ${entry.display_name} error:`, error);
		return {
			source_name: entry.source_name || entry.display_name,
			tickets: [],
			error: error.message
		};
	}
}