#!/bin/bash

echo "=========================================="
echo "PASSWORD RESET FLOW TEST"
echo "=========================================="

# Create a test user
echo "1. Creating test user..."
SIGNUP=$(curl -s -X POST "http://localhost:3001/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"reset-test-$(date +%s)@test.com\",\"password\":\"OldPassword123\",\"name\":\"Reset Test\"}")

USER_EMAIL=$(echo "$SIGNUP" | jq -r '.data.user.email')
echo "Created user: $USER_EMAIL"
echo ""

# Request password reset
echo "2. Requesting password reset..."
FORGOT=$(curl -s -X POST "http://localhost:3001/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\"}")

echo "$FORGOT" | jq '.'
RESET_URL=$(echo "$FORGOT" | jq -r '.data.resetUrl // empty')

if [ -z "$RESET_URL" ]; then
    echo "ERROR: No reset URL returned (check console logs for reset token)"
    echo "Check server logs above for reset token"
    exit 1
fi

# Extract token from URL
RESET_TOKEN=$(echo "$RESET_URL" | sed 's/.*token=//')
echo "Reset token: $RESET_TOKEN"
echo ""

# Reset password
echo "3. Resetting password with token..."
RESET=$(curl -s -X POST "http://localhost:3001/api/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$RESET_TOKEN\",\"newPassword\":\"NewPassword456\"}")

echo "$RESET" | jq '.'
echo ""

# Try to sign in with new password
echo "4. Testing sign in with new password..."
SIGNIN=$(curl -s -X POST "http://localhost:3001/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"NewPassword456\"}")

if echo "$SIGNIN" | jq -e '.data.token' > /dev/null; then
    echo "✅ SUCCESS: Signed in with new password!"
    echo "$SIGNIN" | jq '.data.message'
else
    echo "❌ FAILED: Could not sign in with new password"
    echo "$SIGNIN" | jq '.'
fi

echo ""
echo "=========================================="
echo "PASSWORD RESET FLOW TEST COMPLETE"
echo "=========================================="
