import express from 'express';
import fs from "fs";
import path from "path";
import cors from 'cors';
import dotenv from 'dotenv';

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

// API für Dateiliste
app.get("/api/files", (req, res) => {
	const categoryQuery = req.query.category;
	const templatePath = path.join(FILES_DIR, "template.json");
	if (!fs.existsSync(templatePath)) return res.json([]);

	const templateData = JSON.parse(fs.readFileSync(templatePath, "utf8"));

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

	let result;
	if (categoryQuery) {
		// Scan for specified category (either by directory or display_name)
		const entry = templateData.find(
			(item) => item.directory === categoryQuery || item.display_name === categoryQuery
		);
		if (!entry) return res.json([]);
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
		result = templateData.map((entry) => {
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
		});
	}
	res.json(result);
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
