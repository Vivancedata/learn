#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-${1:-https://learn.vivancedata.com}}"
SENTRY_BASE_URL="${SENTRY_BASE_URL:-https://sentry.io}"
SENTRY_ENVIRONMENT="${SENTRY_ENVIRONMENT:-production}"
SENTRY_TIME_RANGE="${SENTRY_TIME_RANGE:-24h}"
SENTRY_LIMIT="${SENTRY_LIMIT:-5}"
SENTRY_FAIL_ON_UNRESOLVED="${SENTRY_FAIL_ON_UNRESOLVED:-0}"

if ! command -v jq >/dev/null 2>&1; then
  echo "ops-check failed: jq is required."
  exit 1
fi

echo "Running ops check against ${BASE_URL}"

health_json="$(curl -fsS "${BASE_URL}/api/health")"
health_status="$(jq -r '.status // "unknown"' <<<"${health_json}")"
db_status="$(jq -r '.checks.database.status // "unknown"' <<<"${health_json}")"
redis_status="$(jq -r '.checks.redis.status // "unknown"' <<<"${health_json}")"

echo "Health: status=${health_status} db=${db_status} redis=${redis_status}"
if [[ "${health_status}" != "healthy" || "${db_status}" != "up" || "${redis_status}" != "up" ]]; then
  echo "ops-check failed: /api/health is not fully healthy."
  exit 1
fi

readiness_json="$(curl -fsS "${BASE_URL}/api/readiness")"
ready_flag="$(jq -r '.ready // false' <<<"${readiness_json}")"
readiness_status="$(jq -r '.status // "unknown"' <<<"${readiness_json}")"

echo "Readiness: ready=${ready_flag} status=${readiness_status}"
if [[ "${ready_flag}" != "true" ]]; then
  echo "ops-check failed: /api/readiness is not ready."
  exit 1
fi

sentry_token="${SENTRY_READ_TOKEN:-${SENTRY_AUTH_TOKEN:-}}"
if [[ -z "${sentry_token}" ]]; then
  echo "Sentry: skipped (set SENTRY_READ_TOKEN for issue-read checks)."
  echo "ops-check passed."
  exit 0
fi

if [[ -z "${SENTRY_ORG:-}" || -z "${SENTRY_PROJECT:-}" ]]; then
  echo "ops-check failed: SENTRY_ORG and SENTRY_PROJECT are required when Sentry token is set."
  exit 1
fi

issues_file="$(mktemp)"
http_code="$(
  curl -sS -o "${issues_file}" -w "%{http_code}" --get \
    "${SENTRY_BASE_URL}/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/" \
    -H "Authorization: Bearer ${sentry_token}" \
    --data-urlencode "query=is:unresolved" \
    --data-urlencode "environment=${SENTRY_ENVIRONMENT}" \
    --data-urlencode "statsPeriod=${SENTRY_TIME_RANGE}" \
    --data-urlencode "per_page=${SENTRY_LIMIT}"
)"

if [[ "${http_code}" != "200" ]]; then
  echo "ops-check failed: Sentry API returned HTTP ${http_code}."
  head -c 500 "${issues_file}" || true
  rm -f "${issues_file}"
  exit 1
fi

unresolved_count="$(jq 'length' "${issues_file}")"
echo "Sentry: unresolved issues in ${SENTRY_TIME_RANGE} (${SENTRY_ENVIRONMENT}) = ${unresolved_count}"
if [[ "${unresolved_count}" -gt 0 ]]; then
  jq -r '.[] | "  - \(.shortId // .id): \(.title // "Untitled") (events: \(.count // "n/a"))"' "${issues_file}"
fi

rm -f "${issues_file}"

if [[ "${SENTRY_FAIL_ON_UNRESOLVED}" = "1" && "${unresolved_count}" -gt 0 ]]; then
  echo "ops-check failed: unresolved Sentry issues found and SENTRY_FAIL_ON_UNRESOLVED=1."
  exit 1
fi

echo "ops-check passed."
