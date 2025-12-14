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
```

Ensure `backend/.env` `FILES_DIR` matches the root `.env` `FILES_DIR`. This path must be where your files mount is available (WebDAV/NFS/SMB).

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

- `frontend/public/assets/`: CC-BY-SA-4.0
- `frontend/public/external/`: private/third-party, not licensed; integrate manually.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
