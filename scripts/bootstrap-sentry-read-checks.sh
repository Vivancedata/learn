#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${SENTRY_READ_TOKEN:-}" ]]; then
  echo "Missing SENTRY_READ_TOKEN."
  echo "Create a Sentry token with scopes: org:read, project:read, event:read"
  echo "Then set it locally: export SENTRY_READ_TOKEN='sntrys_xxx'"
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Missing gh CLI."
  exit 1
fi

echo "Setting GitHub Actions secret SENTRY_READ_TOKEN..."
gh secret set SENTRY_READ_TOKEN --body "${SENTRY_READ_TOKEN}"

echo "Running production ops check with Sentry enabled..."
npm run ops:check:prod

echo "Sentry read checks are now configured."
