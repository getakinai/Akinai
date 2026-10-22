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
command -v node >/dev/null 2>&1 || fail "Node.js is not installed. Install Node 26 or newer."
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" -ge 26 ] || fail "Node 26 or newer is required (found $(node -v))."
command -v corepack >/dev/null 2>&1 || fail "Corepack is not available. Use Node 26+ with Corepack enabled."
corepack enable >/dev/null 2>&1 || true
command -v yarn >/dev/null 2>&1 || fail "Yarn is not available. Run: corepack enable"
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
SETUP_TOKEN=$(sed -n 's/^SETUP_TOKEN=//p' .env)
if [ -z "$SETUP_TOKEN" ]; then
  SETUP_TOKEN=$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")
  if grep -q '^SETUP_TOKEN=' .env; then
    sed "s/^SETUP_TOKEN=.*/SETUP_TOKEN=$SETUP_TOKEN/" .env > .env.tmp && mv .env.tmp .env
  else
    printf '\nSETUP_TOKEN=%s\n' "$SETUP_TOKEN" >> .env
  fi
  echo "Generated SETUP_TOKEN for the first admin"
else
  echo "SETUP_TOKEN already set"
fi

step "Starting PostgreSQL, Mailpit, Typesense and Redis"
docker compose -f "$COMPOSE_FILE" --env-file .env up -d --wait

step "Running migrations"
node ace migration:run

step "Seeding the database"
SEED_MODE=clean
if [ -t 0 ]; then
  printf 'Seed a clean store or one with demo products? [c]lean / [d]emo (default: clean): '
  read -r answer || answer=""
  case "$answer" in
    d|D|demo|Demo) SEED_MODE=demo ;;
  esac
fi
if [ "$SEED_MODE" = demo ]; then
  yarn db:seed:demo
else
  node ace db:seed
  node ace search:reindex-products
fi

step "Done"
cat <<EOF
Start the app with:   yarn dev

  First admin:  http://localhost:3333/admin/setup
                Setup token: ${SETUP_TOKEN}
  Back office:  http://localhost:3333/admin/login
  Storefront:   http://localhost:3333
  Mail inbox:   http://localhost:8025
EOF
