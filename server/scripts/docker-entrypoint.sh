#!/bin/sh
set -e

mkdir -p /app/logs
echo "$(date -Iseconds) boot: migrate, seed, start" >> /app/logs/server.log

echo "Running PostgreSQL migrations..."
npx sequelize-cli db:migrate

echo "Seeding PostgreSQL..."
npx sequelize-cli db:seed:all

echo "Seeding MongoDB doctor profiles..."
node mongo/seed.js || echo "Mongo seed skipped"

echo "Starting MedConnect API on port ${PORT:-5000}"
exec node server.js
