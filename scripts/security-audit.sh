#!/usr/bin/env sh
# Fails only on high or critical advisories in production dependencies.
# yarn audit's exit code is a bitmask: 1 info, 2 low, 4 moderate, 8 high, 16 critical.
set -u

cd "$(dirname "$0")/.."

yarn audit --groups dependencies
code=$?

if [ $((code & 24)) -ne 0 ]; then
  echo "High or critical vulnerabilities found in production dependencies." >&2
  exit 1
fi
