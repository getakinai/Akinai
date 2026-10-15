#!/usr/bin/env sh
# One-time local setup. Safe to re-run: existing .env, APP_KEY and data are kept.
set -eu

cd "$(dirname "$0")/.."

COMPOSE_FILE=".infra/docker-compose.yml"

step() {
  printf '\n\033[1m==> %s\033[0m\n' "$1"
}

fail() {
  printf '\n\033[31mError:\033[0m %s\n' "$1" >&2
  exit 1
}

step "Checking prerequisites"
command -v node >/dev/null 2>&1 || fail "Node.js is not installed. Install Node 24 or newer."
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" -ge 24 ] || fail "Node 24 or newer is required (found $(node -v))."
command -v yarn >/dev/null 2>&1 || fail "Yarn is not installed. Run: npm i -g yarn"
command -v docker >/dev/null 2>&1 || fail "Docker is not installed."
docker info >/dev/null 2>&1 || fail "Docker is not running. Start Docker Desktop and try again."
[ -f "$COMPOSE_FILE" ] || fail "$COMPOSE_FILE not found. Pull the latest changes from main."
echo "Node $(node -v), Yarn $(yarn -v), Docker OK"

step "Installing dependencies"
yarn install

step "Preparing .env"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
else
  echo ".env already exists, keeping it"
fi
if grep -Eq '^APP_KEY=$' .env; then
  node ace generate:key
else
  echo "APP_KEY already set"
fi

step "Starting PostgreSQL and Mailpit"
docker compose -f "$COMPOSE_FILE" --env-file .env up -d --wait

step "Running migrations"
node ace migration:run

step "Seeding the database"
node ace db:seed

ADMIN_PASSWORD=$(sed -n 's/^SEED_ADMIN_PASSWORD=//p' .env)

step "Done"
cat <<EOF
Start the app with:   yarn dev

  Back office:  http://localhost:3333/admin/login
                admin@example.com / ${ADMIN_PASSWORD:-password123}
  Storefront:   http://localhost:3333
  Mail inbox:   http://localhost:8025
EOF
