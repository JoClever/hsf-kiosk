import dotenv from 'dotenv';

import { createApp } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
// Prefer FILES_DIR, fallback to legacy BASE_DIR for backward compatibility
const FILES_DIR = process.env.FILES_DIR || process.env.BASE_DIR || '/mnt/hsf-kiosk-files';

console.log(`Using FILES_DIR: ${FILES_DIR}`);

const app = createApp({ filesDir: FILES_DIR });

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
