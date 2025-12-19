import express from 'express';
import fs from "fs";
import path from "path";
import cors from 'cors';
import dotenv from 'dotenv';
import ical from 'ical';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
// Prefer FILES_DIR, fallback to legacy BASE_DIR for backward compatibility
const FILES_DIR = process.env.FILES_DIR || process.env.BASE_DIR || '/mnt/hsf-kiosk-files';

console.log(`Using FILES_DIR: ${FILES_DIR}`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to format date as "DD. Monat YYYY"
function formatDate(date) {
	const d = new Date(date);
	const day = d.getDate();
	const monthNames = [
		"Januar",
		"Februar",
		"März",
		"April",
		"Mai",
		"Juni",
		"Juli",
		"August",
		"September",
		"Oktober",
		"November",
		"Dezember",
	];
	const monthName = monthNames[d.getMonth()];
	const year = d.getFullYear();
	return `${day}. ${monthName} ${year}`;
}

// Helper to fetch calendar events
async function fetchCalendarEvents(calendars) {
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
				
				const response = await fetch(calendarUrl);
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				
				const icalData = await response.text();
				const events = ical.parseICS(icalData);
				const now = new Date();
				
				const upcomingEvents = Object.values(events)
					.filter(event => {
						if (event.type !== 'VEVENT') return false;
						const eventDate = new Date(event.start);
						return eventDate >= now;
					})
					.sort((a, b) => new Date(a.start) - new Date(b.start))
					.slice(0, 10)
					.map(event => ({
						summary: event.summary || 'Kein Titel',
						start: event.start,
						end: event.end,
						location: event.location || ''
					}));
				
				return { name: cal.name, events: upcomingEvents };
			} catch (error) {
				console.error(`Calendar ${cal.name} error:`, error);
				return { name: cal.name, events: [], error: error.message };
			}
		})
	);
}

// API für Navigation und Dateien
app.get("/api/navigation", async (req, res) => {
	try {
		const categoryQuery = req.query.category;
		const templatePath = path.join(FILES_DIR, "template.json");
		if (!fs.existsSync(templatePath)) return res.json([]);

		const templateData = JSON.parse(fs.readFileSync(templatePath, "utf8"));

		let result;
		if (categoryQuery) {
			// Scan for specified category (either by directory or display_name)
			const entry = templateData.find(
				(item) => item.directory === categoryQuery || item.display_name === categoryQuery
			);
			if (!entry) return res.json([]);
			
			// Handle calendar type
			if (entry.type === 'calendar') {
				const calendarEvents = await fetchCalendarEvents(entry.calendars);
				return res.json({
					id: entry.id || `calendar-${templateData.indexOf(entry)}`,
					display_name: entry.display_name,
					type: 'calendar',
					url: entry.url || null,
					icon: entry.icon || null,
					calendars: calendarEvents
				});
			}
			
			// Handle documents type
			const catDir = path.join(FILES_DIR, entry.directory);
			if (!fs.existsSync(catDir)) return res.json([]);
			const files = fs.readdirSync(catDir)
				.filter((file) => fs.statSync(path.join(catDir, file)).isFile())
				.map((fileName) => {
					const filePath = path.join(catDir, fileName);
					const stats = fs.statSync(filePath);
					let fileData = {
						file_name: fileName,
						date: formatDate(stats.mtime),
						path: `/docs/${entry.directory}/${fileName}`,
					};
					if (entry.files) {
						const override = entry.files.find((item) => item.file_name === fileName);
						if (override) {
							if (override.display_name) fileData.display_name = override.display_name;
							if (override.date) fileData.date = override.date;
						}
					}
					return fileData;
				});
			result = {
				id: entry.id || entry.directory,
				display_name: entry.display_name,
				type: entry.type || "documents",
				url: entry.url || null,
				icon: entry.icon || null,
				files
			};
		} else {
			// Scan all directories from template.json
			result = await Promise.all(
				templateData.map(async (entry) => {
					// For calendar entries
					if (entry.type === 'calendar') {
						const calendarEvents = await fetchCalendarEvents(entry.calendars);
						return {
							id: entry.id || `calendar-${templateData.indexOf(entry)}`,
							display_name: entry.display_name,
							type: 'calendar',
							url: entry.url || null,
							icon: entry.icon || null,
							calendars: calendarEvents
						};
					}
					
					// For entries without directory (iframe, placeholder)
					if (!entry.directory) {
						return {
							id: entry.id || `page-${templateData.indexOf(entry)}`,
							display_name: entry.display_name,
							type: entry.type || "placeholder",
							url: entry.url || null,
							icon: entry.icon || null,
							files: []
						};
					}

					const catDir = path.join(FILES_DIR, entry.directory);
					let files = [];
					if (fs.existsSync(catDir)) {
						files = fs.readdirSync(catDir)
							.filter((file) => fs.statSync(path.join(catDir, file)).isFile())
							.map((fileName) => {
								const filePath = path.join(catDir, fileName);
								const stats = fs.statSync(filePath);
								let fileData = {
									file_name: fileName,
									date: formatDate(stats.mtime),
									path: `/docs/${entry.directory}/${fileName}`,
								};
								if (entry.files) {
									const override = entry.files.find((item) => item.file_name === fileName);
									if (override) {
										if (override.display_name) fileData.display_name = override.display_name;
										if (override.date) fileData.date = override.date;
									}
								}
								return fileData;
							});
					}
					return {
						id: entry.id || entry.directory,
						display_name: entry.display_name,
						type: entry.type || "documents",
						url: entry.url || null,
						icon: entry.icon || null,
						files
					};
				})
			);
		}
		res.json(result);
	} catch (error) {
		console.error('Navigation error:', error);
		res.status(500).json({ error: 'Failed to load navigation', message: error.message });
	}
});

// API für einzelnen Kalender (optional, falls direkt benötigt)
app.get('/api/calendar/:calendarId', async (req, res) => {
	try {
		const { calendarId } = req.params;
		const calendarUrl = process.env[`CALENDAR_${calendarId.toUpperCase()}`];
		
		if (!calendarUrl) {
			return res.status(404).json({ error: `Calendar ${calendarId} not configured` });
		}
		
		// Fetch iCal data
		const response = await fetch(calendarUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch calendar: ${response.status}`);
		}
		
		const icalData = await response.text();
		const events = ical.parseICS(icalData);
		
		const now = new Date();
		
		// Filter and format upcoming events
		const upcomingEvents = Object.values(events)
			.filter(event => {
				if (event.type !== 'VEVENT') return false;
				const eventDate = new Date(event.start);
				return eventDate >= now;
			})
			.sort((a, b) => new Date(a.start) - new Date(b.start))
			.slice(0, 20) // Limit to next 20 events
			.map(event => ({
				summary: event.summary || 'Kein Titel',
				description: event.description || '',
				start: event.start,
				end: event.end,
				location: event.location || '',
				organizer: event.organizer ? event.organizer.val : null
			}));
		
		res.json(upcomingEvents);
	} catch (error) {
		console.error('Calendar error:', error);
		res.status(500).json({ error: 'Failed to load calendar', message: error.message });
	}
});

// Routes
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok', message: 'HSF Kiosk API is running' });
});

app.get('/api', (req, res) => {
	res.json({ message: 'Welcome to HSF Kiosk API' });
});

// Example endpoint
app.get('/api/data', (req, res) => {
	res.json({
		data: [
			{ id: 1, name: 'Item 1' },
			{ id: 2, name: 'Item 2' },
			{ id: 3, name: 'Item 3' }
		]
	});
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
