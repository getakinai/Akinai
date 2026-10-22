#!/usr/bin/env sh
# Fails on high or critical advisories in production and dev dependencies.
set -eu

cd "$(dirname "$0")/.."

yarn npm audit --recursive --severity high
