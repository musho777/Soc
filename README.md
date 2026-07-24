# Social Network API

Backend API for a social networking platform. Built with NestJS, TypeScript, and PostgreSQL.

## What is this?

This is a REST API that handles user authentication, and friend requests. Think of it like a simplified version of Facebook's friend system - you can register, send friend requests, accept/decline them, and search for users.

## Tech Stack

- **NestJS** - Node.js framework (similar to Express but with better structure)
- **TypeScript** - Because plain JavaScript gets messy real fast
- **PostgreSQL** - Database
- **JWT** - Authentication tokens
- **Docker** - For easy deployment

## Quick Start

### Prerequisites

You'll need:

- Node.js (v20+)
- PostgreSQL (v14+)
- Docker (optional but recommended)

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

The friend request system is bidirectional - meaning you can't send multiple requests to the same person, and you can't be friends with yourself (yeah, I had to add validation for that).

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

## Database Structure

Two main tables:

**users**

- id (UUID, primary key)
- email (unique, case-insensitive)
- username (unique)
- password_hash (bcrypt)
- first_name, last_name
- date_of_birth
- created_at, updated_at

**friend_requests**

- id (UUID, primary key)
- sender_id (references users)
- receiver_id (references users)
- status (PENDING, ACCEPTED, DECLINED, BLOCKED)
- created_at, updated_at, responded_at

I also added some PostgreSQL functions like `calculate_age()` and `are_friends()` to make queries cleaner.

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

**Important:** Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to something secure in production. D

## Testing

```bash
npm run test
```

Currently only have unit tests for the auth service.

## Project Structure

```
src/
├── auth/               # Login, register, JWT stuff
├── users/              # User profiles, search
├── friends/            # Friend requests, friendships
├── database/           # DB connection, schema files
├── app.module.ts       # Main app module
└── main.ts             # Entry point
```

## Author

Built by Mush Poghosyan
