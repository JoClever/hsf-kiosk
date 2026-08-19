import express from 'express';
import cors from 'cors';

import { fetchCalendarEventsById } from './services/calendar.js';
import { getNavigationData } from './services/navigation.js';

export function createApp({ filesDir }) {
	const app = express();

	app.use(cors());
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	app.get('/api/navigation', async (req, res) => {
		try {
			const categoryQuery = req.query.category;
			const result = await getNavigationData(filesDir, categoryQuery);
			res.json(result);
		} catch (error) {
			console.error('Navigation error:', error);
			res.status(500).json({ error: 'Failed to load navigation', message: error.message });
		}
	});

	app.get('/api/calendar/:calendarId', async (req, res) => {
		try {
			const { calendarId } = req.params;
			const calendarUrl = process.env[`CALENDAR_${calendarId.toUpperCase()}`];

			if (!calendarUrl) {
				return res.status(404).json({ error: `Calendar ${calendarId} not configured` });
			}

			const upcomingEvents = await fetchCalendarEventsById(calendarUrl);
			res.json(upcomingEvents);
		} catch (error) {
			console.error('Calendar error:', error);
			res.status(500).json({ error: 'Failed to load calendar', message: error.message });
		}
	});

	app.get('/api/health', (req, res) => {
		res.json({ status: 'ok', message: 'HSF Kiosk API is running' });
	});

	app.get('/api', (req, res) => {
		res.json({ message: 'Welcome to HSF Kiosk API' });
	});

	app.get('/api/data', (req, res) => {
		res.json({
			data: [
				{ id: 1, name: 'Item 1' },
				{ id: 2, name: 'Item 2' },
				{ id: 3, name: 'Item 3' }
			]
		});
	});

	app.use((err, req, res, next) => {
		console.error(err.stack);
		res.status(500).json({ error: 'Something went wrong!' });
	});

	app.use((req, res) => {
		res.status(404).json({ error: 'Route not found' });
	});

	return app;
}