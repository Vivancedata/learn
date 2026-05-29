#!/bin/bash

# Quick test to verify role enforcement
echo "Creating test user..."
curl -s -X POST "http://localhost:3001/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"roletest-$(date +%s)@test.com\",\"password\":\"Test1234\",\"name\":\"Role Test\"}" \
  -c /tmp/role-test-cookie.txt | jq '.data.user.id, .data.token' -r

echo ""
echo "Testing project review as student (should fail with 403)..."
curl -s -X POST "http://localhost:3001/api/projects/fake-project-id/review" \
  -H "Content-Type: application/json" \
  -b /tmp/role-test-cookie.txt \
  -d '{"status":"approved","feedback":"This should be blocked"}' | jq '.'

rm -f /tmp/role-test-cookie.txt
