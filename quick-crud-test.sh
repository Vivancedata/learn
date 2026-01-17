#!/bin/bash

echo "Testing signup..."
curl -s -X POST "http://localhost:3001/api/auth/signup" \
  -H "Content-Type: application/json" \
  --cookie-jar test-cookies.txt \
  -d '{"email":"quicktest@test.com","password":"TestPass123","name":"Quick Test"}' | jq '.'

echo ""
echo "Testing signin..."
curl -s -X POST "http://localhost:3001/api/auth/signin" \
  -H "Content-Type: application/json" \
  --cookie-jar test-cookies.txt \
  -d '{"email":"quicktest@test.com","password":"TestPass123"}' | jq '.'

echo ""
echo "Testing GET profile..."
curl -s -X GET "http://localhost:3001/api/user/profile" \
  -H "Content-Type: application/json" \
  --cookie test-cookies.txt | jq '.'

echo ""
echo "Testing PATCH profile..."
curl -s -X PATCH "http://localhost:3001/api/user/profile" \
  -H "Content-Type: application/json" \
  --cookie test-cookies.txt \
  -d '{"name":"Updated Quick Test","githubUsername":"quicktester"}' | jq '.'

rm -f test-cookies.txt
