import ical from 'ical';
import fetch from 'node-fetch';

function mapUpcomingEvents(events, now, limit, includeDescription, includeOrganizer) {
	return Object.values(events)
		.filter((event) => {
			if (event.type !== 'VEVENT') return false;
			const eventDate = new Date(event.start);
			return eventDate >= now;
		})
		.sort((a, b) => new Date(a.start) - new Date(b.start))
		.slice(0, limit)
		.map((event) => {
			const mapped = {
				summary: event.summary || 'Kein Titel',
				start: event.start,
				end: event.end,
				location: event.location || ''
			};

			if (includeDescription) {
				mapped.description = event.description || '';
			}

			if (includeOrganizer) {
				mapped.organizer = event.organizer ? event.organizer.val : null;
			}

			return mapped;
		});
}

async function fetchUpcomingEventsFromUrl(calendarUrl, options = {}) {
	const {
		limit = 10,
		includeDescription = false,
		includeOrganizer = false
	} = options;

	const response = await fetch(calendarUrl);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}

	const icalData = await response.text();
	const events = ical.parseICS(icalData);
	const now = new Date();

	return mapUpcomingEvents(events, now, limit, includeDescription, includeOrganizer);
}

export async function fetchCalendarEvents(calendars) {
	if (!calendars || !Array.isArray(calendars)) {
		return [];
	}

	return await Promise.all(
		calendars.map(async (cal) => {
			try {
				const calendarUrl = cal.url || process.env[cal.url_env];
				if (!calendarUrl) {
					return { name: cal.name, events: [], error: 'Not configured' };
				}

				const upcomingEvents = await fetchUpcomingEventsFromUrl(calendarUrl, { limit: 10 });
				return { name: cal.name, events: upcomingEvents };
			} catch (error) {
				console.error(`Calendar ${cal.name} error:`, error);
				return { name: cal.name, events: [], error: error.message };
			}
		})
	);
}

export async function fetchCalendarEventsById(calendarUrl) {
	return await fetchUpcomingEventsFromUrl(calendarUrl, {
		limit: 20,
		includeDescription: true,
		includeOrganizer: true
	});
}