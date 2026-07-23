# API Examples

Complete collection of API request examples using cURL.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 1. Authentication Endpoints

### Register a New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "username": "johndoe",
    "password": "Password123!",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-05-15",
    "bio": "Software developer passionate about technology"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-05-15",
    "bio": "Software developer passionate about technology",
    "is_active": true,
    "is_verified": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "Password123!"
  }'
```

**Response:** Same as registration

---

## 2. User Endpoints

### Get Current User Profile

```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1990-05-15",
  "age": 33,
  "bio": "Software developer passionate about technology",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Search Users by First Name

```bash
curl "http://localhost:3000/api/v1/users/search?first_name=John" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Search Users by Last Name

```bash
curl "http://localhost:3000/api/v1/users/search?last_name=Doe" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Search Users by Age Range

```bash
curl "http://localhost:3000/api/v1/users/search?age_min=25&age_max=40" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Advanced Search (Combined Filters)

```bash
curl "http://localhost:3000/api/v1/users/search?first_name=John&last_name=Doe&age_min=25&age_max=40&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "1990-05-15",
      "age": 33,
      "bio": "Software developer",
      "is_verified": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### Get User by ID

```bash
curl http://localhost:3000/api/v1/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get User by Username

```bash
curl http://localhost:3000/api/v1/users/username/johndoe \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 3. Friend Request Endpoints

### Send Friend Request

```bash
curl -X POST http://localhost:3000/api/v1/friends/requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver_id": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

**Response:**
```json
{
  "message": "Friend request sent successfully",
  "request": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "sender_id": "550e8400-e29b-41d4-a716-446655440000",
    "receiver_id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "pending",
    "created_at": "2024-01-15T11:00:00Z"
  }
}
```

### Get Pending Friend Requests (Received)

```bash
curl http://localhost:3000/api/v1/friends/requests/pending \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "sender_id": "550e8400-e29b-41d4-a716-446655440000",
      "receiver_id": "660e8400-e29b-41d4-a716-446655440001",
      "status": "pending",
      "created_at": "2024-01-15T11:00:00Z",
      "sender": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "johndoe",
        "first_name": "John",
        "last_name": "Doe",
        "profile_picture_url": null
      }
    }
  ],
  "count": 1
}
```

### Get Sent Friend Requests

```bash
curl http://localhost:3000/api/v1/friends/requests/sent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "sender_id": "550e8400-e29b-41d4-a716-446655440000",
      "receiver_id": "660e8400-e29b-41d4-a716-446655440001",
      "status": "pending",
      "created_at": "2024-01-15T11:00:00Z",
      "receiver": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "username": "janesmith",
        "first_name": "Jane",
        "last_name": "Smith",
        "profile_picture_url": null
      }
    }
  ],
  "count": 1
}
```

### Accept Friend Request

```bash
curl -X PATCH http://localhost:3000/api/v1/friends/requests/770e8400-e29b-41d4-a716-446655440002/accept \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Friend request accepted",
  "request": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "sender_id": "550e8400-e29b-41d4-a716-446655440000",
    "receiver_id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "accepted",
    "created_at": "2024-01-15T11:00:00Z",
    "updated_at": "2024-01-15T11:05:00Z",
    "responded_at": "2024-01-15T11:05:00Z"
  }
}
```

### Decline Friend Request

```bash
curl -X PATCH http://localhost:3000/api/v1/friends/requests/770e8400-e29b-41d4-a716-446655440002/decline \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Friend request declined",
  "request": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "status": "declined",
    "updated_at": "2024-01-15T11:05:00Z",
    "responded_at": "2024-01-15T11:05:00Z"
  }
}
```

### Cancel Sent Friend Request

```bash
curl -X DELETE http://localhost:3000/api/v1/friends/requests/770e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Friend request cancelled successfully"
}
```

---

## 4. Friends List Endpoints

### Get Friends List

```bash
curl http://localhost:3000/api/v1/friends \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Friends List with Pagination

```bash
curl "http://localhost:3000/api/v1/friends?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "username": "janesmith",
      "first_name": "Jane",
      "last_name": "Smith",
      "profile_picture_url": null,
      "bio": "Designer and creative",
      "friends_since": "2024-01-15T11:05:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### Remove Friend (Unfriend)

```bash
curl -X DELETE http://localhost:3000/api/v1/friends/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Friend removed successfully"
}
```

### Get Friendship Status with User

```bash
curl http://localhost:3000/api/v1/friends/status/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (if friends):**
```json
{
  "status": "accepted",
  "areFriends": true,
  "mutualFriendsCount": 5,
  "requestId": "770e8400-e29b-41d4-a716-446655440002",
  "requestSender": "you"
}
```

**Response (if no relationship):**
```json
{
  "status": "none",
  "areFriends": false
}
```

---

## 5. Health Check

### Check API Health

```bash
curl http://localhost:3000/api/v1/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "uptime": 3600,
  "database": {
    "status": "connected",
    "pool": {
      "totalCount": 5,
      "idleCount": 3,
      "waitingCount": 0
    }
  },
  "memory": {
    "used": 45,
    "total": 128,
    "unit": "MB"
  }
}
```

---

## Complete Workflow Example

### Scenario: Two users become friends

```bash
# 1. Register User A (Alice)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "username": "alice",
    "password": "Password123!",
    "first_name": "Alice",
    "last_name": "Smith",
    "date_of_birth": "1995-03-20"
  }'
# Save ALICE_TOKEN

# 2. Register User B (Bob)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "username": "bob",
    "password": "Password123!",
    "first_name": "Bob",
    "last_name": "Johnson",
    "date_of_birth": "1992-07-15"
  }'
# Save BOB_TOKEN and BOB_ID

# 3. Alice searches for Bob
curl "http://localhost:3000/api/v1/users/search?first_name=Bob" \
  -H "Authorization: Bearer ALICE_TOKEN"

# 4. Alice sends friend request to Bob
curl -X POST http://localhost:3000/api/v1/friends/requests \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"receiver_id": "BOB_ID"}'

# 5. Bob views pending requests
curl http://localhost:3000/api/v1/friends/requests/pending \
  -H "Authorization: Bearer BOB_TOKEN"
# Note REQUEST_ID

# 6. Bob accepts the request
curl -X PATCH http://localhost:3000/api/v1/friends/requests/REQUEST_ID/accept \
  -H "Authorization: Bearer BOB_TOKEN"

# 7. Alice views her friends
curl http://localhost:3000/api/v1/friends \
  -H "Authorization: Bearer ALICE_TOKEN"

# 8. Check friendship status
curl http://localhost:3000/api/v1/friends/status/BOB_ID \
  -H "Authorization: Bearer ALICE_TOKEN"
```

---

## Error Responses

### 400 Bad Request - Validation Error

```json
{
  "statusCode": 400,
  "timestamp": "2024-01-15T12:00:00.000Z",
  "path": "/api/v1/auth/register",
  "method": "POST",
  "message": [
    "email must be an email",
    "password must be at least 8 characters long"
  ],
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "timestamp": "2024-01-15T12:00:00.000Z",
  "path": "/api/v1/users/me",
  "method": "GET",
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "timestamp": "2024-01-15T12:00:00.000Z",
  "path": "/api/v1/users/123",
  "method": "GET",
  "message": "User not found",
  "error": "Not Found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "timestamp": "2024-01-15T12:00:00.000Z",
  "path": "/api/v1/auth/register",
  "method": "POST",
  "message": "Email already registered",
  "error": "Conflict"
}
```

---

## Notes

- Replace `YOUR_JWT_TOKEN` with the actual token from login/register
- Replace UUIDs with actual IDs from your database
- All timestamps are in ISO 8601 format (UTC)
- Passwords must contain: uppercase, lowercase, and number
- Minimum age for registration is 13 years
- Username must be 3-50 alphanumeric characters or underscore

---

For interactive testing, use the Swagger UI at:
**http://localhost:3000/api/docs**
