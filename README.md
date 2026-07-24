# Social Network API

A REST API for a social networking platform focusing on user management and friend connections. Built with NestJS, TypeScript, and PostgreSQL.

## Overview

This project implements the core backend functionality you'd find in social networks - user authentication, profiles, and a friend request system. It's similar to how Facebook or LinkedIn handle connections between users.

## Tech Stack & Why I Chose It

- **NestJS** - Went with NestJS over vanilla Express because it has built-in dependency injection and a modular architecture that makes testing and scaling easier. The decorators and module system keep things organized as the codebase grows.

- **TypeScript** - Type safety caught a lot of bugs during development, especially around the friend request state machine (pending/accepted/declined states).

- **PostgreSQL** - Needed a relational database for the friend connections since they're inherently relationship-based. Postgres also has great support for complex queries and I used some custom functions to handle age calculations and friendship checks.

- **JWT (Access + Refresh tokens)** - Implemented a dual-token system for better security. Access tokens expire in 7 days, refresh tokens last 30 days. This means if an access token gets compromised, the window is limited.

- **Docker** - Made deployment and local development consistent across machines. No more "works on my machine" issues.

## Architecture

The application follows NestJS's modular architecture with three main feature modules:

```
Auth Module → Handles registration, login, token refresh
Users Module → Profile management and user search
Friends Module → Friend requests and connections
```

**Key Design Decisions:**

1. **Stateless Authentication** - Using JWT means no session storage needed, easier to scale horizontally.

2. **Database-level constraints** - Added unique constraints and foreign keys at the DB level rather than just relying on application logic. If the app has bugs, at least the data stays consistent.

3. **Bidirectional friend requests** - The `friend_requests` table tracks both directions (sender/receiver), so I can query pending requests efficiently without scanning the entire table.

4. **Rate limiting** - Added throttling to prevent spam on sensitive endpoints (registration, login, friend requests).

5. **Soft validation** - Email uniqueness is case-insensitive at the database level using `LOWER(email)` index. Usernames are case-sensitive though.

## Quick Start

### Prerequisites

- Node.js (v20+)
- PostgreSQL (v14+)
- Docker (optional, but makes setup easier)

### Setup

1. Clone and install:

```bash
git clone https://github.com/musho777/Soc.git
cd social-api
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env
```

Edit `.env` and update your database credentials.

3. Setup the database:

```bash
# Create database
createdb social_network

# Run the schema
psql -d social_network -f src/database/schema/001_initial_schema.sql
```

4. Start the server:

```bash
npm run start:dev
```

The API should be running on `http://localhost:3000/api`

Check out the Swagger docs at `http://localhost:3000/api/docs` to see all available endpoints.

## Docker Setup (easier way)

If you have Docker installed, just run:

```bash
docker-compose up -d
```

This will start:

- The API on port 3000
- PostgreSQL on port 5432
- pgAdmin on port 5050 (useful for viewing the database)

To stop everything:

```bash
docker-compose down
```

## How to Use

### 1. Register a user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Password123",
    "firstName": "Test",
    "lastName": "User",
    "dateOfBirth": "1995-01-01"
  }'
```

You'll get back an access token and user info.

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

### 3. Use the token for protected endpoints

For any authenticated endpoint, add the token to the Authorization header:

```bash
Authorization: Bearer YOUR_TOKEN_HERE
```

## Main Features

### User Management

- Register with email/password
- Login/logout with JWT tokens
- Search users by name or age range
- Get user profiles

### Friend System

- Send friend requests
- Accept or decline requests
- View pending requests (received)
- View sent requests
- List all your friends (with pagination)
- Remove friends
- Check friendship status between users

The friend request system is bidirectional - you can't send multiple requests to the same person, and you can't befriend yourself (learned that the hard way after someone tried it during testing).

## API Endpoints

### Auth

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Get JWT token
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Invalidate refresh token

### Users

- `GET /api/users/me` - Your profile
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/search` - Search users (supports first_name, last_name, age_min, age_max)

### Friends

- `POST /api/friends/requests` - Send friend request
- `GET /api/friends/requests/pending` - Requests you received
- `GET /api/friends/requests/sent` - Requests you sent
- `PATCH /api/friends/requests/:id/accept` - Accept request
- `PATCH /api/friends/requests/:id/decline` - Decline request
- `DELETE /api/friends/requests/:id` - Cancel your sent request
- `GET /api/friends` - Your friends list
- `DELETE /api/friends/:friendId` - Unfriend someone
- `GET /api/friends/status/:userId` - Check friendship status

## Database Schema

The schema is intentionally simple with just two main tables:

**users**

- `id` - UUID primary key (using gen_random_uuid())
- `email` - Unique, case-insensitive via index on LOWER(email)
- `username` - Unique, case-sensitive
- `password_hash` - Bcrypt hashed (10 rounds)
- `first_name`, `last_name` - User's name
- `date_of_birth` - For age-based search
- `created_at`, `updated_at` - Timestamps

**friend_requests**

- `id` - UUID primary key
- `sender_id` - FK to users (who sent the request)
- `receiver_id` - FK to users (who received it)
- `status` - Enum: PENDING, ACCEPTED, DECLINED, BLOCKED
- `created_at`, `updated_at`, `responded_at` - Tracking timestamps

**Why this structure?**

I considered making a separate `friendships` table for accepted requests, but decided against it. Keeping everything in `friend_requests` with status changes makes the history trackable. If you want to see when two people became friends, it's all there.

The table has indexes on `(sender_id, receiver_id)` and `(receiver_id, sender_id)` for fast lookups in both directions.

**Custom Postgres Functions:**

- `calculate_age(date_of_birth)` - Returns current age, used in search queries
- `are_friends(user1_id, user2_id)` - Returns boolean, checks if an ACCEPTED request exists between two users

## Environment Variables

Here's what you need in your `.env` file:

```env
# App
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=social_network
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MIN=2
DB_POOL_MAX=10

# JWT
JWT_SECRET=change-this-to-something-random-and-secure
JWT_EXPIRATION=7d
JWT_REFRESH_SECRET=another-secret-for-refresh-tokens
JWT_REFRESH_EXPIRATION=30

# Security
BCRYPT_ROUNDS=10
```

**Important:** Change `JWT_SECRET` and `JWT_REFRESH_SECRET` in production. Use a strong random string (at least 32 characters). You can generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Testing

```bash
# Unit tests
npm run test

# Watch mode (useful during development)
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

Currently have unit tests for the auth service. Still need to add tests for the friends module - that's next on my list.

## Project Structure

```
src/
├── auth/               # Authentication (register, login, JWT strategy)
├── users/              # User management (profiles, search)
├── friends/            # Friend system (requests, connections)
├── database/           # Database config and schema migrations
├── app.module.ts       # Root module
└── main.ts             # Bootstrap file
```

Each module follows NestJS conventions: controllers for routes, services for business logic, DTOs for validation.

## Challenges & Learnings

**Problem 1: Preventing duplicate friend requests**

Initially, users could spam friend requests because I only checked one direction. Fixed it by adding a unique constraint on `(sender_id, receiver_id)` and checking both directions before allowing a new request.

**Problem 2: Cascading deletes**

When a user is deleted, what happens to their friend requests? I added `ON DELETE CASCADE` to the foreign keys, so everything gets cleaned up automatically. The alternative was soft deletes, but that complicates queries.

**Problem 3: Age calculation performance**

Originally calculated age in the application layer, but doing age-based search meant scanning every user. Moved the calculation to a Postgres function and it's much faster now since the DB can filter before returning results.

## What I'd Improve

If I had more time / this was production:

1. **Add caching** - Redis for frequently accessed data (user profiles, friend lists)
2. **Pagination improvements** - Current pagination is offset-based. Cursor-based would be better for large datasets
3. **Email verification** - Right now you can register with any email. Should add verification tokens
4. **More comprehensive testing** - E2E tests for the entire friend request flow
5. **Monitoring** - Add logging aggregation (maybe Winston + ELK stack) and metrics
6. **WebSocket support** - For real-time friend request notifications

## Security Considerations

- **Rate limiting** - Configured via `@nestjs/throttler` to prevent abuse
- **Password hashing** - Using bcrypt with 10 rounds (adjustable via env)
- **SQL injection** - Protected via parameterized queries (pg library handles this)
- **JWT security** - Tokens are stateless but include expiry. Refresh tokens allow revocation if needed
- **CORS** - Configured in main.ts, currently allows all origins (should restrict in production)
- **Input validation** - All DTOs use class-validator decorators to sanitize input

## Author

Built by **Mush Poghosyan**
