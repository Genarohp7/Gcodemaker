#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/genar/apps/gcodemaker-ai"
RELEASE_TAR="/tmp/gc-broadcast-backend-prod.tar.gz"
RELEASE_DIR="/tmp/gc-broadcast-backend-release"
BACKUP_DIR="/home/genar/apps/gcodemaker-ai.backup-$(date +%Y%m%d-%H%M%S)"
APP_USER="genar"
APP_GROUP="genar"

if [ "$(id -u)" -ne 0 ]; then
  echo "Ejecuta este instalador con sudo para poder escribir en $APP_DIR."
  exit 1
fi

if [ ! -f "$RELEASE_TAR" ]; then
  echo "No existe el paquete $RELEASE_TAR"
  exit 1
fi

if [ ! -d "$APP_DIR" ]; then
  echo "No existe la carpeta de la app $APP_DIR"
  exit 1
fi

cd "$APP_DIR"
DB_HOST_VALUE="$(node -p 'require("dotenv").config({ quiet: true }); process.env.DB_HOST || ""')"
DB_PORT_VALUE="$(node -p 'require("dotenv").config({ quiet: true }); process.env.DB_PORT || 5432')"

echo "Verificando conexion a PostgreSQL ${DB_HOST_VALUE}:${DB_PORT_VALUE}..."
if ! timeout 8s bash -c "cat < /dev/null > /dev/tcp/${DB_HOST_VALUE}/${DB_PORT_VALUE}"; then
  echo "No hay conexion a PostgreSQL. Autoriza la IP externa de la VM antes de desplegar."
  echo "IP de la VM: $(curl -sS --max-time 3 ifconfig.me || true)"
  exit 20
fi

echo "Creando backup en $BACKUP_DIR..."
cp -a "$APP_DIR" "$BACKUP_DIR"

echo "Preparando release..."
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"
tar -xzf "$RELEASE_TAR" -C "$RELEASE_DIR"
chown -R "$APP_USER:$APP_GROUP" "$RELEASE_DIR"

echo "Aplicando archivos..."
cp -a "$RELEASE_DIR/package.json" "$APP_DIR/package.json"
cp -a "$RELEASE_DIR/src/." "$APP_DIR/src/"
chown -R "$APP_USER:$APP_GROUP" "$APP_DIR/package.json" "$APP_DIR/src"

echo "Ejecutando migraciones..."
sudo -u "$APP_USER" bash -lc "cd $APP_DIR && npm run db:migrate"

echo "Reiniciando PM2..."
sudo -u "$APP_USER" env PM2_HOME=/home/genar/.pm2 pm2 restart gcodemaker-ai-api --update-env

echo "Verificando health..."
curl -sS --max-time 5 http://127.0.0.1:3000/health
echo
echo "Despliegue de GC Broadcast finalizado."
