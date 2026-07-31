#!/bin/bash
# Generate .htpasswd for Basic Auth on /admin
# Usage: ./deploy.sh htpasswd <username> <password>

set -e

HTPASSWD_DIR="./docker"
HTPASSWD_FILE="$HTPASSWD_DIR/.htpasswd"

mkdir -p "$HTPASSWD_DIR"

case "$1" in
  htpasswd)
    USER="${2:-admin}"
    PASS="${3:-changeme}"
    if command -v htpasswd >/dev/null 2>&1; then
      htpasswd -cb "$HTPASSWD_FILE" "$USER" "$PASS"
    else
      HASH=$(openssl passwd -apr1 "$PASS")
      echo "${USER}:${HASH}" > "$HTPASSWD_FILE"
    fi
    echo "✓ Created $HTPASSWD_FILE with user '$USER'"
    ;;
  build)
    docker compose up -d --build
    ;;
  logs)
    docker compose logs -f
    ;;
  restart)
    docker compose restart
    ;;
  stop)
    docker compose down
    ;;
  *)
    echo "Usage: $0 {htpasswd|build|logs|restart|stop}"
    echo ""
    echo "  htpasswd <user> <pass>  — generate .htpasswd"
    echo "  build                   — build & start container"
    echo "  logs                    — tail container logs"
    echo "  restart                 — restart container"
    echo "  stop                    — stop container"
    ;;
esac
