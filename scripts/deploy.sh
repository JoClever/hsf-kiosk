#!/bin/bash

# HSF Kiosk - Deploy Script
# This script deploys the application to a production server

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Load global deployment configuration
if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
else
    echo "ℹ️  .env not found in repo root, using default deployment values"
fi

export APP_NAME=${APP_NAME:-hsf-kiosk}
export BACKEND_DIR=${BACKEND_DIR:-/opt/${APP_NAME}}
export FRONTEND_DIR=${FRONTEND_DIR:-/srv/${APP_NAME}}
export FILES_DIR=${FILES_DIR:-/mnt/${APP_NAME}-files}
export NGINXCONF_DIR=${NGINXCONF_DIR:-/etc/nginx/conf.d}
export NGINX_PORT=${NGINX_PORT:-80}
export NODE_PORT=${NODE_PORT:-3000}
export SERVER_NAME=${SERVER_NAME:-your-domain.com}
export SCREENSAVER_UPSTREAM=${SCREENSAVER_UPSTREAM:-}

if [ -z "$SCREENSAVER_UPSTREAM" ]; then
    echo "❌ SCREENSAVER_UPSTREAM is required"
    exit 1
fi

case "$SCREENSAVER_UPSTREAM" in
    https://*) ;;
    *)
        echo "❌ SCREENSAVER_UPSTREAM must use HTTPS for direct iframe embedding"
        exit 1
        ;;
esac

echo "🚀 Deploying ${APP_NAME}..."

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ nginx is not installed. Please install nginx first."
    exit 1
fi

echo "✅ nginx is installed (version: $(nginx -v 2>&1 | cut -d'/' -f2))"

# Ensure target directories exist
echo ""
echo "📂 Ensuring target directories exist..."
sudo mkdir -p "$FRONTEND_DIR" "$BACKEND_DIR" "$FILES_DIR"

# Build the frontend
echo ""
echo "📦 Building frontend..."
cd frontend
VITE_API_BASE_URL=/api/ VITE_SCREENSAVER_URL="${SCREENSAVER_UPSTREAM}" npm run build
cd ..

# Sync built frontend to target
echo ""
echo "🚚 Syncing frontend build to $FRONTEND_DIR..."
sudo rsync -a frontend/dist/ "$FRONTEND_DIR"/

# Sync backend to target (without node_modules)
echo ""
echo "🚚 Syncing backend to $BACKEND_DIR..."
sudo rsync -a backend/ "$BACKEND_DIR"/ --exclude node_modules

echo "🔐 Installing backend runtime environment..."
BACKEND_ENV_FILE="$(mktemp)"
cat > "$BACKEND_ENV_FILE" <<EOF
PORT=${NODE_PORT}
NODE_ENV=production
FILES_DIR=${FILES_DIR}
EOF
while IFS= read -r variable; do
    if [ -n "${!variable:-}" ]; then
        printf '%s=%s\n' "$variable" "${!variable}" >> "$BACKEND_ENV_FILE"
    fi
done <<'EOF'
CALENDAR_HSF
CALENDAR_EVENTS
ZAMMAD_API_URL
ZAMMAD_API_TOKEN
EOF
sudo install -o nginx -g nginx -m 600 "$BACKEND_ENV_FILE" "$BACKEND_DIR/.env"
rm "$BACKEND_ENV_FILE"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd "$BACKEND_DIR"
sudo npm install --production
cd "$ROOT_DIR"

# Render and copy NGINX configuration
echo ""
echo "📋 Rendering NGINX configuration..."
TMP_NGINX_CONF="$(mktemp)"
envsubst '$NGINX_PORT $SERVER_NAME $FRONTEND_DIR $NODE_PORT $FILES_DIR' < scripts/nginx.conf > "$TMP_NGINX_CONF"
sudo cp "$TMP_NGINX_CONF" ${NGINXCONF_DIR}/${APP_NAME}.conf
rm "$TMP_NGINX_CONF"
echo "✅ NGINX configuration copied to ${NGINXCONF_DIR}/${APP_NAME}.conf"

# Test NGINX configuration
echo ""
echo "🔍 Testing NGINX configuration..."
sudo nginx -t

# Reload NGINX
echo ""
echo "🔄 Reloading NGINX..."
sudo systemctl reload nginx

# Setup backend service (optional)
# Uncomment if you want to use systemd to manage the backend
echo ""
echo "📋 Setting up backend service..."
sudo cp scripts/hsf-kiosk-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable hsf-kiosk-backend
sudo systemctl restart hsf-kiosk-backend

echo ""
echo "✅ Deployment complete!"
echo "Your application should now be accessible via NGINX at http://${SERVER_NAME}:${NGINX_PORT}/"
