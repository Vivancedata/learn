#!/usr/bin/env bash

set -euo pipefail

PORT="${PORT:-3100}"
BASE_URL="${BASE_URL:-http://127.0.0.1:${PORT}}"
SERVER_LOG="${SERVER_LOG:-/tmp/vivance-e2e-server.log}"
DATABASE_URL="${DATABASE_URL:-file:./prisma/dev.db}"
ALLOW_FILE_DATABASE_IN_PRODUCTION="${ALLOW_FILE_DATABASE_IN_PRODUCTION:-true}"
TEST_USER_EMAIL="${TEST_USER_EMAIL:-user@example.com}"
TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-User1234!}"
JWT_SECRET="${JWT_SECRET:-e2e-insecure-jwt-secret-change-in-production}"
PW=(npx --yes --package @playwright/cli playwright-cli)

assert_contains() {
  local output="$1"
  local expected="$2"
  local message="$3"
  if ! grep -Fq "$expected" <<<"$output"; then
    echo "E2E assertion failed: ${message}"
    echo "Expected to find: ${expected}"
    echo "Command output:"
    echo "$output"
    exit 1
  fi
}

cleanup() {
  "${PW[@]}" close-all >/dev/null 2>&1 || true
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT

echo "Starting Next.js app for e2e checks on ${BASE_URL}..."
rm -f .next/dev/lock
echo "Preparing database schema for e2e run..."
if ! DATABASE_URL="${DATABASE_URL}" npx prisma db push >/tmp/vivance-e2e-db.log 2>&1; then
  echo "Warning: prisma db push failed; proceeding with existing schema."
  tail -n 40 /tmp/vivance-e2e-db.log || true
fi

echo "Seeding curriculum and assessments for e2e run..."
if ! DATABASE_URL="${DATABASE_URL}" TEST_USER_EMAIL="${TEST_USER_EMAIL}" TEST_USER_PASSWORD="${TEST_USER_PASSWORD}" npm run db:seed >/tmp/vivance-e2e-seed.log 2>&1; then
  echo "E2E setup failed: database seed failed."
  echo "Seed log tail:"
  tail -n 120 /tmp/vivance-e2e-seed.log || true
  exit 1
fi

echo "Building app for production-like e2e run..."
if ! DATABASE_URL="${DATABASE_URL}" ALLOW_FILE_DATABASE_IN_PRODUCTION="${ALLOW_FILE_DATABASE_IN_PRODUCTION}" JWT_SECRET="${JWT_SECRET}" npm run build:webpack > /tmp/vivance-e2e-build.log 2>&1; then
  echo "E2E setup failed: production build failed."
  echo "Build log tail:"
  tail -n 120 /tmp/vivance-e2e-build.log || true
  exit 1
fi

DATABASE_URL="${DATABASE_URL}" ALLOW_FILE_DATABASE_IN_PRODUCTION="${ALLOW_FILE_DATABASE_IN_PRODUCTION}" JWT_SECRET="${JWT_SECRET}" npm run start -- --port "${PORT}" >"${SERVER_LOG}" 2>&1 &
SERVER_PID=$!

echo "Waiting for app to be ready..."
for _ in $(seq 1 120); do
  if curl -fsS "${BASE_URL}/pricing" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "${BASE_URL}/pricing" >/dev/null 2>&1; then
  echo "E2E setup failed: app did not become ready in time."
  echo "Server log tail:"
  tail -n 80 "${SERVER_LOG}" || true
  exit 1
fi

"${PW[@]}" close-all >/dev/null 2>&1 || true

echo "Running pricing flow assertions..."
open_output=$("${PW[@]}" open "${BASE_URL}/pricing")
assert_contains "$open_output" "Page URL: ${BASE_URL}/pricing" "pricing page should load"

heading_output=$("${PW[@]}" eval "() => document.querySelector('h1')?.textContent?.trim()")
assert_contains "$heading_output" "\"Invest in Your Future\"" "pricing heading should render"

interval_before=$("${PW[@]}" eval "() => document.querySelector('[data-testid=\"pro-interval\"]')?.textContent")
assert_contains "$interval_before" "\"/year\"" "default interval should be yearly"

savings_before=$("${PW[@]}" eval "() => Boolean(document.querySelector('[data-testid=\"yearly-savings\"]'))")
assert_contains "$savings_before" "true" "yearly savings badge should be visible by default"

toggle_result=$("${PW[@]}" eval "() => { const toggle = document.querySelector('[data-testid=\"billing-toggle\"]'); if (!toggle) return 'missing'; toggle.click(); return 'clicked'; }")
assert_contains "$toggle_result" "\"clicked\"" "billing toggle should be clickable"

interval_after=$("${PW[@]}" eval "() => document.querySelector('[data-testid=\"pro-interval\"]')?.textContent")
assert_contains "$interval_after" "\"/month\"" "interval should switch to monthly"

savings_after=$("${PW[@]}" eval "() => Boolean(document.querySelector('[data-testid=\"yearly-savings\"]'))")
assert_contains "$savings_after" "false" "yearly badge should hide on monthly"

faq_expand=$("${PW[@]}" eval "async () => { const button = [...document.querySelectorAll('button')].find((el) => el.textContent?.includes('Is there a free trial?')); if (!button) return 'missing'; button.click(); await new Promise((resolve) => setTimeout(resolve, 75)); return button.getAttribute('aria-expanded'); }")
assert_contains "$faq_expand" "\"true\"" "faq item should expand when clicked"

faq_answer=$("${PW[@]}" eval "() => document.body.textContent?.includes('7-day free trial')")
assert_contains "$faq_answer" "true" "expanded faq answer should be visible"

echo "Running authentication and curriculum assertions..."
signin_open=$("${PW[@]}" goto "${BASE_URL}/sign-in")
assert_contains "$signin_open" "Page URL: ${BASE_URL}/sign-in" "sign in page should load"

signin_form_ready=$("${PW[@]}" eval "() => Boolean(document.querySelector('#email') && document.querySelector('#password') && document.querySelector('form'))")
assert_contains "$signin_form_ready" "true" "sign in form should be rendered"

signin_fill=$("${PW[@]}" eval "() => { const email = document.querySelector('#email'); const password = document.querySelector('#password'); if (!email || !password) return false; const setValue = (element, value) => { const prototype = Object.getPrototypeOf(element); const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value'); descriptor?.set?.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true })); }; setValue(email, '${TEST_USER_EMAIL}'); setValue(password, '${TEST_USER_PASSWORD}'); return email.value.length > 0 && password.value.length > 0; }")
assert_contains "$signin_fill" "true" "sign in form should accept credentials"

signin_submit=$("${PW[@]}" eval "async () => { const form = document.querySelector('form'); if (!form) return 'missing'; form.requestSubmit(); for (let i = 0; i < 60; i++) { await new Promise((resolve) => setTimeout(resolve, 100)); if (window.location.pathname === '/dashboard') return window.location.pathname; } const errorText = document.querySelector('[role=\"alert\"]')?.textContent?.trim() || ''; return window.location.pathname + '|' + errorText; }")
assert_contains "$signin_submit" "\"/dashboard\"" "sign in should redirect to dashboard"

courses_open=$("${PW[@]}" goto "${BASE_URL}/courses")
assert_contains "$courses_open" "Page URL: ${BASE_URL}/courses" "courses page should load"

has_course_links=$("${PW[@]}" eval "() => [...document.querySelectorAll('a[href]')].some((el) => /^\\/courses\\/[^\\/]+$/.test(el.getAttribute('href') || ''))")
assert_contains "$has_course_links" "true" "at least one course should be available"

open_first_course=$("${PW[@]}" eval "async () => { const link = [...document.querySelectorAll('a[href]')].find((el) => /^\\/courses\\/[^\\/]+$/.test(el.getAttribute('href') || '')); if (!link) return 'missing'; link.click(); for (let i = 0; i < 60; i++) { await new Promise((resolve) => setTimeout(resolve, 100)); if (/^\\/courses\\/[^\\/]+$/.test(window.location.pathname)) return window.location.pathname; } return window.location.pathname; }")
assert_contains "$open_first_course" "/courses/" "clicking a course should open the course page"

has_lesson_links=$("${PW[@]}" eval "() => [...document.querySelectorAll('a[href]')].some((el) => /^\\/courses\\/[^\\/]+\\/[^\\/]+$/.test(el.getAttribute('href') || ''))")
assert_contains "$has_lesson_links" "true" "course page should list at least one lesson"

open_first_lesson=$("${PW[@]}" eval "async () => { const link = [...document.querySelectorAll('a[href]')].find((el) => /^\\/courses\\/[^\\/]+\\/[^\\/]+$/.test(el.getAttribute('href') || '')); if (!link) return 'missing'; link.click(); for (let i = 0; i < 60; i++) { await new Promise((resolve) => setTimeout(resolve, 100)); if (/^\\/courses\\/[^\\/]+\\/[^\\/]+$/.test(window.location.pathname)) return window.location.pathname; } return window.location.pathname; }")
assert_contains "$open_first_lesson" "/courses/" "clicking a lesson should open the lesson page"

lesson_heading=$("${PW[@]}" eval "() => Boolean(document.querySelector('h1')?.textContent?.trim())")
assert_contains "$lesson_heading" "true" "lesson page should render a heading"

assessments_open=$("${PW[@]}" goto "${BASE_URL}/assessments")
assert_contains "$assessments_open" "Page URL: ${BASE_URL}/assessments" "assessments page should load"

has_assessments=$("${PW[@]}" eval "() => [...document.querySelectorAll('a[href]')].some((el) => /^\\/assessments\\/[^\\/]+$/.test(el.getAttribute('href') || ''))")
assert_contains "$has_assessments" "true" "at least one assessment should be listed"

echo "Running offline page assertions..."
offline_open=$("${PW[@]}" goto "${BASE_URL}/offline")
assert_contains "$offline_open" "Page URL: ${BASE_URL}/offline" "offline page should load"

offline_title=$("${PW[@]}" eval "() => document.querySelector('h1')?.textContent?.includes('Offline')")
assert_contains "$offline_title" "true" "offline title should render"

try_again=$("${PW[@]}" eval "() => { const button = [...document.querySelectorAll('button')].find((el) => el.textContent?.includes('Try Again')); if (!button) return 'missing'; button.click(); return 'clicked'; }")
assert_contains "$try_again" "\"clicked\"" "Try Again button should be clickable"

path_after_reload=$("${PW[@]}" eval "() => window.location.pathname")
assert_contains "$path_after_reload" "\"/offline\"" "offline reload should stay on offline route"

echo "E2E checks passed."
