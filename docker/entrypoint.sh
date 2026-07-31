#!/bin/sh
set -e

HTPASSWD=/etc/nginx/.htpasswd

if [ ! -f "$HTPASSWD" ]; then
    echo "⚠  .htpasswd not found at $HTPASSWD"
    echo "   Generate one with:  docker compose exec web htpasswd -cb /etc/nginx/.htpasswd admin password"
    echo "   Or mount it via docker-compose volumes."
fi

decap-server --port 8081 --backend local --media-folder /usr/share/nginx/html/assets/images --public-folder /assets/images &

exec nginx -g 'daemon off;'
