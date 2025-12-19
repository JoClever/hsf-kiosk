# HSF Kiosk Webapp

A full-stack web application with a Svelte + Vite frontend and Express.js REST API backend.

## Project Structure

```plaintext
hsf-kiosk/
├── frontend/          # Svelte + Vite frontend application
├── backend/           # Express.js REST API
├── scripts/           # Deployment and installation scripts
└── .github/           # GitHub configuration
```

## Prerequisites

- Node.js (v18 or higher)
- npm
- NGINX (for production deployment)

## Quick Start

### Using the Install Script

```bash
./scripts/install.sh
```

This will install all dependencies for both frontend and backend.

### Manual Installation

1. **Install Backend Dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies:**

   ```bash
   cd frontend
   npm install
   ```

3. **Create Backend Environment File:**

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Development

### Start Backend Server

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:3000`

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api` - Welcome message
- `GET /api/data` - Example data endpoint
- `GET /api/navigation` - Get navigation structure with files and calendar events from template.json
- `GET /api/calendar/:calendarId` - Fetch and parse iCal calendar events (optional, for direct access)

## Production Build

### Using the Build Script

```bash
./scripts/build.sh
```

### Manual Build

```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/`

## Deployment

### Global Deployment Config (.env)

Create a `.env` in the repo root (or copy `.env.example`) to configure deploy targets:

```bash
APP_NAME=hsf-kiosk
BACKEND_DIR=/opt/${APP_NAME}
FRONTEND_DIR=/srv/${APP_NAME}
FILES_DIR=/mnt/${APP_NAME}-files
NGINX_PORT=80
NODE_PORT=3000
SERVER_NAME=your-domain.com
```

Defaults are used if variables are absent.

**Files mount:** `FILES_DIR` should point to the mounted content location (WebDAV, NFS, or SMB). Mount it before deploying so the backend can read `template.json` and files.

### Prerequisites - Deployment

- NGINX installed on your server
- Node.js installed on your server
- Root or sudo access

### Using the Deploy Script

```bash
./scripts/deploy.sh
```

This script will:

1. Load `.env` (or defaults) for directories and ports
2. Build the frontend
3. Sync frontend to `$FRONTEND_DIR` and backend to `$BACKEND_DIR`
4. Render `nginx.conf` with `envsubst` and install it as `/etc/nginx/sites-available/$APP_NAME`
5. Test and reload NGINX

### Update Procedure (production)

1. Pull latest code and install deps (from repo root):

   ```bash
   git pull
   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   ```

2. Ensure files mount is present at `FILES_DIR` (see `.env`).

3. Redeploy:

   ```bash
   ./scripts/deploy.sh
   ```

This rebuilds the frontend, syncs backend/frontend to the configured targets, renders NGINX config, tests, and reloads NGINX.

### Manual Deployment

1. **Build the frontend:**

   ```bash
   cd frontend
   npm run build
   ```

2. **Copy files to web server:**
  
   ```bash
   sudo rsync -a frontend/dist/ /srv/hsf-kiosk/
   sudo rsync -a backend/ /opt/hsf-kiosk/ --exclude node_modules
   ```

3. **Configure NGINX:**

   ```bash
   sudo cp scripts/nginx.conf /etc/nginx/sites-available/hsf-kiosk
   sudo ln -s /etc/nginx/sites-available/hsf-kiosk /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Setup Backend Service (Optional):**

   ```bash
   sudo cp scripts/hsf-kiosk-backend.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable hsf-kiosk-backend
   sudo systemctl start hsf-kiosk-backend
   ```

### NGINX Configuration

The NGINX configuration file (`scripts/nginx.conf`) includes:

- Static file serving for the frontend
- Reverse proxy for the backend API at `/api/`
- Gzip compression
- Security headers
- Static asset caching

**Important:** Update `server_name` in `scripts/nginx.conf` with your actual domain.

## Environment Variables

### Backend (.env)

```plaintext
PORT=3000
NODE_ENV=development
FILES_DIR=/mnt/hsf-kiosk-files

# Calendar URLs (configured in template.json with url_env field)
# Example: CALENDAR_HSF=https://example.com/calendar.ics
CALENDAR_HSF=
CALENDAR_EVENTS=
```

Ensure `backend/.env` `FILES_DIR` matches the root `.env` `FILES_DIR`. This path must be where your files mount is available (WebDAV/NFS/SMB).

### Calendar Configuration

Calendar pages are configured in `template.json` and require corresponding environment variables in `backend/.env`:

1. **In template.json:**
   ```json
   {
     "id": "termine",
     "type": "calendar",
     "display_name": "Termine",
     "calendars": [
       {
         "name": "HSF Kalender",
         "url_env": "CALENDAR_HSF"
       },
       {
         "name": "Events",
         "url_env": "CALENDAR_EVENTS"
       }
     ]
   }
   ```

2. **In backend/.env:**
   ```plaintext
   CALENDAR_HSF=https://example.com/hsf-calendar.ics
   CALENDAR_EVENTS=https://example.com/events.ics
   ```

The backend will fetch and parse iCal files from the configured URLs and provide the next 20 upcoming events per calendar.

## Content Configuration (template.json)

The application's navigation structure, pages, and content sources are configured via `template.json` in the `FILES_DIR` directory. This file defines what appears in the navigation and how content is displayed.

**Location:** `${FILES_DIR}/template.json` (e.g., `/mnt/hsf-kiosk-files/template.json`)

**Example:** See [scripts/template.json.example](scripts/template.json.example) for a complete reference.

### Page Types

#### 1. Documents Page (`type: "documents"`)

Displays a list of files from a specific directory.

```json
{
  "id": "aktuelles",
  "display_name": "Aktuelles",
  "type": "documents",
  "directory": "Aktuelles",
  "icon": "advertising",
  "files": [
    {
      "file_name": "2011-04 Example.pdf",
      "display_name": "Custom Display Name.pdf",
      "date": "11. April 2011"
    }
  ]
}
```

- **`id`**: Unique identifier for the page
- **`display_name`**: Name shown in navigation
- **`type`**: Set to `"documents"`
- **`directory`**: Folder name relative to `FILES_DIR`
- **`icon`** (optional): Icon name for navigation button
- **`files`** (optional): Array to override file display names and dates

#### 2. IFrame Page (`type: "iframe"`)

Embeds an external website in an iframe.

```json
{
  "id": "hsf-website",
  "display_name": "HSF-Website",
  "type": "iframe",
  "url": "https://hsf-ev.de",
  "icon": "home"
}
```

- **`url`**: External website URL to embed

#### 3. Calendar Page (`type: "calendar"`)

Displays upcoming events from one or more iCal calendars.

```json
{
  "id": "termine",
  "display_name": "Termine",
  "type": "calendar",
  "icon": "planner",
  "calendars": [
    {
      "name": "HSF Kalender",
      "url": "https://example.com/calendar.ics"
    },
    {
      "name": "Events",
      "url_env": "CALENDAR_EVENTS"
    }
  ]
}
```

- **`calendars`**: Array of calendar sources
  - **`name`**: Display name for the calendar
  - **`url`**: Direct iCal URL (use for public calendars)
  - **`url_env`**: Environment variable name containing the URL (use for private calendars)

If using `url_env`, set the corresponding variable in `backend/.env`:
```bash
CALENDAR_EVENTS=https://example.com/private-calendar.ics
```

### Complete Example

See [scripts/template.json.example](scripts/template.json.example) for a full working example with multiple page types.

## Scripts

- `scripts/install.sh`                 - Install all dependencies
- `scripts/build.sh`                   - Build frontend for production
- `scripts/deploy.sh`                  - Deploy to production server
- `scripts/nginx.conf`                 - NGINX server configuration
- `scripts/hsf-kiosk-backend.service`  - Systemd service for backend

## Technology Stack

### Frontend

- **Svelte 5** - Component framework
- **Vite 7** - Build tool and dev server
- **Rolldown** - Fast bundler

### Backend

- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Deployment (Linux)

- **NGINX** - Web server and reverse proxy
- **Systemd** - Service management (optional)

## Development Guidelines

- Use TypeScript where applicable
- Follow REST API conventions
- Keep components modular and reusable
- Use environment variables for configuration
- Test API endpoints before deploying

## API Proxy

The frontend development server is configured to proxy API requests to the backend:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`
- Proxy: Requests to `/api/*` are forwarded to the backend

## License

Code: ISC

Assets:

- `frontend/public/assets/icons`: CC0-1.0 (Public Domain)
- `frontend/public/external/`: private/third-party, not licensed; integrate manually.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
