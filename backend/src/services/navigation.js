import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

import { buildDocumentFileData } from '../lib/content-utils.js';
import { fetchCalendarEvents, flattenCalendarEvents } from './calendar.js';
import { fetchTickets } from './tickets.js';

function loadTemplateData(filesDir) {
	const yamlPath = path.join(filesDir, 'template.yaml');
	const yamlPath2 = path.join(filesDir, 'template.yml');
	const jsonPath = path.join(filesDir, 'template.json');

	try {
		if (fs.existsSync(yamlPath)) {
			const data = yaml.load(fs.readFileSync(yamlPath, 'utf8'));
			return Array.isArray(data) ? data : [];
		}

		if (fs.existsSync(yamlPath2)) {
			const data = yaml.load(fs.readFileSync(yamlPath2, 'utf8'));
			return Array.isArray(data) ? data : [];
		}
	} catch (err) {
		console.error('Failed to parse template YAML:', err);
		return [];
	}

	if (!fs.existsSync(jsonPath)) {
		return [];
	}

	return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function buildCalendarResponse(entry, templateData, calendarEvents) {
	return {
		id: entry.id || `calendar-${templateData.indexOf(entry)}`,
		display_name: entry.display_name,
		type: 'calendar',
		url: entry.url || null,
		icon: entry.icon || null,
		calendars: calendarEvents,
		events: flattenCalendarEvents(calendarEvents)
	};
}

function buildTicketsResponse(entry, templateData, ticketData) {
	return {
		id: entry.id || `tickets-${templateData.indexOf(entry)}`,
		display_name: entry.display_name,
		type: 'tickets',
		icon: entry.icon || null,
		source_name: ticketData.source_name,
		tickets: ticketData.tickets,
		error: ticketData.error || null
	};
}

function buildDocumentResponse(entry, filesDir, files) {
	return {
		id: entry.id || entry.directory,
		display_name: entry.display_name,
		type: entry.type || 'documents',
		url: entry.url || null,
		icon: entry.icon || null,
		files
	};
}

async function buildEntryResponse(entry, templateData, filesDir) {
	if (entry.type === 'calendar') {
		const calendarEvents = await fetchCalendarEvents(entry.calendars);
		return buildCalendarResponse(entry, templateData, calendarEvents);
	}

	if (entry.type === 'tickets') {
		const ticketData = await fetchTickets(entry);
		return buildTicketsResponse(entry, templateData, ticketData);
	}

	if (!entry.directory) {
		return {
			id: entry.id || `page-${templateData.indexOf(entry)}`,
			display_name: entry.display_name,
			type: entry.type || 'placeholder',
			url: entry.url || null,
			icon: entry.icon || null,
			files: []
		};
	}

	const catDir = path.join(filesDir, entry.directory);
	let files = [];
	if (fs.existsSync(catDir)) {
		files = fs.readdirSync(catDir)
			.filter((file) => fs.statSync(path.join(catDir, file)).isFile())
			.map((fileName) => buildDocumentFileData(entry, fileName, fs.statSync(path.join(catDir, fileName))));
	}

	return buildDocumentResponse(entry, filesDir, files);
}

export async function getNavigationData(filesDir, categoryQuery = null) {
	const templateData = loadTemplateData(filesDir);
	if (categoryQuery) {
		const entry = templateData.find(
			(item) => item.directory === categoryQuery || item.display_name === categoryQuery
		);
		if (!entry) return [];

		return await buildEntryResponse(entry, templateData, filesDir);
	}

	return await Promise.all(
		templateData.map(async (entry) => await buildEntryResponse(entry, templateData, filesDir))
	);
}