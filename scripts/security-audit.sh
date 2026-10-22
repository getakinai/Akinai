#!/usr/bin/env sh
# Fails on high or critical advisories in production and dev dependencies.
set -eu

cd "$(dirname "$0")/.."

exec node .yarn/releases/yarn-4.18.1.cjs npm audit --recursive --severity high
