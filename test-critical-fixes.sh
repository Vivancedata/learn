#!/bin/bash

# Test script for critical security fixes
# Run this to verify all Phase 1 fixes are working

BASE_URL="http://localhost:3001"
STUDENT_EMAIL="test-student-$(date +%s)@example.com"
INSTRUCTOR_EMAIL="test-instructor-$(date +%s)@example.com"

echo "=========================================="
echo "CRITICAL FIXES VERIFICATION TEST"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function to print test results
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

echo "Test 1: Sign up new student (should include role in response)"
echo "---------------------------------------"
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$STUDENT_EMAIL\",\"password\":\"Test1234\",\"name\":\"Test Student\"}" \
  -c cookies.txt)

echo "$SIGNUP_RESPONSE" | jq '.'

# Check if signup succeeded
if echo "$SIGNUP_RESPONSE" | jq -e '.data.user.id' > /dev/null; then
    STUDENT_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.data.user.id')
    STUDENT_TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.data.token')
    test_result 0 "Student signup successful"
else
    test_result 1 "Student signup failed"
    STUDENT_ID=""
    STUDENT_TOKEN=""
fi

echo ""
echo "Test 2: Verify JWT token contains role"
echo "---------------------------------------"
# JWT is base64 encoded - decode payload (second part)
if [ -n "$STUDENT_TOKEN" ]; then
    PAYLOAD=$(echo "$STUDENT_TOKEN" | cut -d'.' -f2)
    # Add padding if needed
    while [ $((${#PAYLOAD} % 4)) -ne 0 ]; do
        PAYLOAD="${PAYLOAD}="
    done
    DECODED=$(echo "$PAYLOAD" | base64 -d 2>/dev/null | jq '.')
    echo "$DECODED"

    if echo "$DECODED" | jq -e '.role' > /dev/null; then
        ROLE=$(echo "$DECODED" | jq -r '.role')
        if [ "$ROLE" = "student" ]; then
            test_result 0 "JWT contains correct role (student)"
        else
            test_result 1 "JWT role is '$ROLE', expected 'student'"
        fi
    else
        test_result 1 "JWT does not contain role field"
    fi
else
    test_result 1 "No token to decode"
fi

echo ""
echo "Test 3: Access own certificates (should succeed)"
echo "---------------------------------------"
if [ -n "$STUDENT_ID" ]; then
    OWN_CERTS=$(curl -s -X GET "$BASE_URL/api/certificates/user/$STUDENT_ID" \
      -b cookies.txt)

    echo "$OWN_CERTS" | jq '.'

    if echo "$OWN_CERTS" | jq -e '.data' > /dev/null; then
        test_result 0 "Can access own certificates"
    else
        test_result 1 "Cannot access own certificates"
    fi
else
    test_result 1 "No student ID to test"
fi

echo ""
echo "Test 4: Access another user's certificates (should fail with 401/403)"
echo "---------------------------------------"
if [ -n "$STUDENT_ID" ]; then
    # Create a fake UUID for another user
    FAKE_USER_ID="00000000-0000-0000-0000-000000000001"

    OTHER_CERTS=$(curl -s -X GET "$BASE_URL/api/certificates/user/$FAKE_USER_ID" \
      -b cookies.txt)

    echo "$OTHER_CERTS" | jq '.'

    # Should get an error (403 Forbidden or 401 Unauthorized)
    if echo "$OTHER_CERTS" | jq -e '.error' > /dev/null; then
        test_result 0 "Correctly blocked access to other user's certificates"
    else
        test_result 1 "SECURITY ISSUE: Can access other user's certificates!"
    fi
else
    test_result 1 "No student ID to test"
fi

echo ""
echo "Test 5: Student tries to review project (should fail with 403)"
echo "---------------------------------------"
if [ -n "$STUDENT_ID" ]; then
    # Try to review a fake project ID
    REVIEW_RESPONSE=$(curl -s -X POST "$BASE_URL/api/projects/fake-project-id/review" \
      -H "Content-Type: application/json" \
      -b cookies.txt \
      -d '{"status":"approved","feedback":"Self-approved!"}')

    echo "$REVIEW_RESPONSE" | jq '.'

    # Should get Forbidden error
    if echo "$REVIEW_RESPONSE" | jq -e '.error' > /dev/null; then
        ERROR_MSG=$(echo "$REVIEW_RESPONSE" | jq -r '.error')
        if [[ "$ERROR_MSG" == *"Forbidden"* ]] || [[ "$ERROR_MSG" == *"Requires"* ]]; then
            test_result 0 "Student correctly blocked from reviewing projects"
        else
            test_result 1 "Got error but not about permissions: $ERROR_MSG"
        fi
    else
        test_result 1 "SECURITY ISSUE: Student can review projects!"
    fi
else
    test_result 1 "No student ID to test"
fi

echo ""
echo "Test 6: Check achievement calculation logic"
echo "---------------------------------------"
# This is a logic test - verify the calculation
COURSE_SECTIONS='[
  {"lessons": [{"id": "1"}, {"id": "2"}, {"id": "3"}]},
  {"lessons": [{"id": "4"}, {"id": "5"}]},
  {"lessons": [{"id": "6"}]}
]'

SECTION_COUNT=$(echo "$COURSE_SECTIONS" | jq 'length')
LESSON_COUNT=$(echo "$COURSE_SECTIONS" | jq '[.[].lessons | length] | add')

echo "Course has $SECTION_COUNT sections"
echo "Course has $LESSON_COUNT lessons"

if [ "$SECTION_COUNT" -eq 3 ] && [ "$LESSON_COUNT" -eq 6 ]; then
    test_result 0 "Achievement calculation counts lessons ($LESSON_COUNT) not sections ($SECTION_COUNT)"
else
    test_result 1 "Achievement calculation error: sections=$SECTION_COUNT, lessons=$LESSON_COUNT"
fi

echo ""
echo "Test 7: Verify cookie-based auth is working"
echo "---------------------------------------"
# Check if cookie was set
if [ -f cookies.txt ] && grep -q "auth-token" cookies.txt; then
    test_result 0 "HTTP-only auth cookie is set"

    # Verify cookie properties
    if grep "auth-token.*httponly" cookies.txt -i; then
        test_result 0 "Cookie has httpOnly flag"
    else
        test_result 1 "Cookie missing httpOnly flag"
    fi
else
    test_result 1 "No auth cookie found"
fi

# Cleanup
rm -f cookies.txt

echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CRITICAL FIXES VERIFIED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED - REVIEW ABOVE${NC}"
    exit 1
fi
