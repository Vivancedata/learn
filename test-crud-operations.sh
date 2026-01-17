#!/bin/bash

# Test script for CRUD operations (Phase 2)
# Tests: Discussion CRUD, Project CRUD, User Profile GET/PATCH

echo "========================================"
echo "TESTING CRUD OPERATIONS"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Base URL
BASE_URL="http://localhost:3001"

# Helper function to check if response is success
check_success() {
    local response="$1"
    local test_name="$2"

    if echo "$response" | jq -e '.data' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name"
        echo "Response: $response"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Helper function to check if response is error with specific status
check_error() {
    local response="$1"
    local expected_error="$2"
    local test_name="$3"

    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        local error=$(echo "$response" | jq -r '.error')
        if [[ "$error" == "$expected_error" ]]; then
            echo -e "${GREEN}✓ PASS${NC} - $test_name"
            ((TESTS_PASSED++))
            return 0
        fi
    fi

    echo -e "${RED}✗ FAIL${NC} - $test_name"
    echo "Expected error: $expected_error"
    echo "Response: $response"
    ((TESTS_FAILED++))
    return 1
}

echo "========================================"
echo "STEP 1: Create Test Users"
echo "========================================"

# Create first user and sign in
USER1_DATA=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  -d '{
    "email": "crud_user1@test.com",
    "password": "TestPass123",
    "name": "CRUD Test User 1"
  }')

USER1_ID=$(echo "$USER1_DATA" | jq -r '.data.user.id')
echo "User 1 created: $USER1_ID"

# Sign in as user 1 to get auth cookie
curl -s -X POST "$BASE_URL/api/auth/signin" \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  -d '{
    "email": "crud_user1@test.com",
    "password": "TestPass123"
  }' > /dev/null

echo "User 1 signed in"

# Create second user
USER2_DATA=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "crud_user2@test.com",
    "password": "TestPass123",
    "name": "CRUD Test User 2"
  }')

USER2_ID=$(echo "$USER2_DATA" | jq -r '.data.user.id')
echo "User 2 created: $USER2_ID"
echo ""

echo "========================================"
echo "STEP 2: User Profile Tests"
echo "========================================"

# Test 1: GET user profile
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/user/profile" \
  -H "Content-Type: application/json" \
  --cookie cookies.txt)

check_success "$PROFILE_RESPONSE" "Get user profile"

# Test 2: PATCH user profile
UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/user/profile" \
  -H "Content-Type: application/json" \
  --cookie cookies.txt \
  -d '{
    "name": "Updated CRUD User",
    "githubUsername": "crudtester"
  }')

check_success "$UPDATE_RESPONSE" "Update user profile"
echo ""

echo "========================================"
echo "STEP 3: Discussion CRUD Tests"
echo "========================================"

# Get a course ID for testing
COURSES=$(curl -s -X GET "$BASE_URL/api/courses")
COURSE_ID=$(echo "$COURSES" | jq -r '.data.courses[0].id')
echo "Using course ID: $COURSE_ID"

# Test 3: Create discussion (User 1)
DISCUSSION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/discussions" \
  -H "Content-Type: application/json" \
  --cookie cookies.txt \
  -d "{
    \"userId\": \"$USER1_ID\",
    \"content\": \"This is a test discussion for CRUD operations testing.\",
    \"courseId\": \"$COURSE_ID\"
  }")

DISCUSSION_ID=$(echo "$DISCUSSION_RESPONSE" | jq -r '.data.discussionId')
check_success "$DISCUSSION_RESPONSE" "Create discussion"
echo "Discussion created: $DISCUSSION_ID"

# Test 4: Update own discussion
UPDATE_DISC_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/discussions/$DISCUSSION_ID" \
  -H "Content-Type: application/json" \
  --cookie cookies.txt \
  -d '{
    "content": "This is an UPDATED discussion content for testing CRUD operations."
  }')

check_success "$UPDATE_DISC_RESPONSE" "Update own discussion"

# Test 5: Try to update someone else's discussion (should fail)
# Login as user 2
curl -s -X POST "$BASE_URL/api/auth/signin" \
  -H "Content-Type: application/json" \
  --cookie-jar cookies2.txt \
  -d '{
    "email": "crud_user2@test.com",
    "password": "TestPass123"
  }' > /dev/null

FORBIDDEN_UPDATE=$(curl -s -X PATCH "$BASE_URL/api/discussions/$DISCUSSION_ID" \
  -H "Content-Type: application/json" \
  --cookie cookies2.txt \
  -d '{
    "content": "Trying to hijack this discussion!"
  }')

check_error "$FORBIDDEN_UPDATE" "Forbidden" "Prevent updating others' discussions"

# Switch back to user 1
curl -s -X POST "$BASE_URL/api/auth/signin" \
  -H "Content-Type: application/json" \
  --cookie-jar cookies.txt \
  -d '{
    "email": "crud_user1@test.com",
    "password": "TestPass123"
  }' > /dev/null

# Test 6: Delete own discussion
DELETE_DISC_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/discussions/$DISCUSSION_ID" \
  -H "Content-Type: application/json" \
  --cookie cookies.txt)

check_success "$DELETE_DISC_RESPONSE" "Delete own discussion"
echo ""

echo "========================================"
echo "STEP 4: Project CRUD Tests"
echo "========================================"

# Get a lesson with project
LESSONS=$(curl -s -X GET "$BASE_URL/api/lessons?courseId=$COURSE_ID")
PROJECT_LESSON_ID=$(echo "$LESSONS" | jq -r '[.data.lessons[] | select(.hasProject == true)][0].id')

if [ "$PROJECT_LESSON_ID" != "null" ] && [ -n "$PROJECT_LESSON_ID" ]; then
    echo "Using lesson ID: $PROJECT_LESSON_ID"

    # Test 7: Submit project
    PROJECT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/projects" \
      -H "Content-Type: application/json" \
      --cookie cookies.txt \
      -d "{
        \"userId\": \"$USER1_ID\",
        \"lessonId\": \"$PROJECT_LESSON_ID\",
        \"githubUrl\": \"https://github.com/testuser/test-project\",
        \"liveUrl\": \"https://test-project.vercel.app\",
        \"notes\": \"Initial submission for testing CRUD\"
      }")

    PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.data.submissionId')
    check_success "$PROJECT_RESPONSE" "Submit project"
    echo "Project submitted: $PROJECT_ID"

    # Test 8: Update own project (while pending)
    UPDATE_PROJ_RESPONSE=$(curl -s -X PATCH "$BASE_URL/api/projects/$PROJECT_ID" \
      -H "Content-Type: application/json" \
      --cookie cookies.txt \
      -d '{
        "githubUrl": "https://github.com/testuser/updated-project",
        "notes": "Updated project submission"
      }')

    check_success "$UPDATE_PROJ_RESPONSE" "Update own pending project"

    # Test 9: Try to update someone else's project (should fail)
    FORBIDDEN_PROJ=$(curl -s -X PATCH "$BASE_URL/api/projects/$PROJECT_ID" \
      -H "Content-Type: application/json" \
      --cookie cookies2.txt \
      -d '{
        "notes": "Trying to hijack this project!"
      }')

    check_error "$FORBIDDEN_PROJ" "Forbidden" "Prevent updating others' projects"

    # Test 10: Delete own project
    DELETE_PROJ_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/projects/$PROJECT_ID" \
      -H "Content-Type: application/json" \
      --cookie cookies.txt)

    check_success "$DELETE_PROJ_RESPONSE" "Delete own project"
else
    echo -e "${YELLOW}⚠ SKIP${NC} - No lessons with projects found"
    echo -e "${YELLOW}⚠ SKIP${NC} - Submit project"
    echo -e "${YELLOW}⚠ SKIP${NC} - Update own pending project"
    echo -e "${YELLOW}⚠ SKIP${NC} - Prevent updating others' projects"
    echo -e "${YELLOW}⚠ SKIP${NC} - Delete own project"
fi

echo ""

# Cleanup
rm -f cookies.txt cookies2.txt

echo "========================================"
echo "TEST SUMMARY"
echo "========================================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi
