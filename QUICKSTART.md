# Quick Start Guide

Get the Social Network API up and running in 5 minutes.

## Option 1: Docker Compose (Recommended)

This is the fastest way to get started. Everything is configured for you.

### Prerequisites
- Docker
- Docker Compose

### Steps

1. **Clone and navigate to the project**
   ```bash
   cd social-api
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Wait for services to be healthy** (~30 seconds)
   ```bash
   docker-compose logs -f api
   ```

4. **Access the application**
   - API: http://localhost:3000/api/v1
   - API Docs: http://localhost:3000/api/docs
   - pgAdmin: http://localhost:5050

That's it! The database schema is automatically applied.

## Option 2: Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm

### Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

3. **Create database**
   ```bash
   createdb social_network
   ```

4. **Apply schema**
   ```bash
   psql -d social_network -f src/database/schema/001_initial_schema.sql
   ```

5. **Start development server**
   ```bash
   npm run start:dev
   ```

6. **Access the application**
   - API: http://localhost:3000/api/v1
   - API Docs: http://localhost:3000/api/docs

## Testing the API

### 1. Using Swagger UI (Easiest)

1. Go to http://localhost:3000/api/docs
2. Try the `/auth/register` endpoint
3. Copy the JWT token from the response
4. Click "Authorize" button at the top
5. Paste the token
6. Now you can test all protected endpoints

### 2. Using cURL

**Register a user:**
```bash
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
```

Save the `access_token` from the response.

**Get your profile:**
```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Search users:**
```bash
curl "http://localhost:3000/api/v1/users/search?first_name=Alice" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Using Postman

1. Import the API from Swagger: http://localhost:3000/api/docs-json
2. Set up an environment variable for the JWT token
3. Test all endpoints

## Common Commands

### Docker

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f api

# Restart API
docker-compose restart api

# Stop all services
docker-compose down

# Stop and remove data
docker-compose down -v

# Rebuild images
docker-compose build --no-cache
```

### Development

```bash
# Start dev server with hot reload
npm run start:dev

# Build for production
npm run build

# Start production build
npm run start:prod

# Run tests
npm test

# Format code
npm run format

# Lint code
npm run lint
```

### Database

```bash
# Connect to PostgreSQL (Docker)
docker-compose exec postgres psql -U postgres -d social_network

# Connect to PostgreSQL (Local)
psql -d social_network

# View tables
\dt

# View users
SELECT * FROM users;

# View friend requests
SELECT * FROM friend_requests;

# View friendships
SELECT * FROM friendships;
```

## Sample Workflow

Let's create two users and make them friends:

### 1. Register User A (Alice)

```bash
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
```

Save Alice's token: `ALICE_TOKEN`

### 2. Register User B (Bob)

```bash
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
```

Save Bob's token: `BOB_TOKEN` and user ID: `BOB_ID`

### 3. Alice searches for Bob

```bash
curl "http://localhost:3000/api/v1/users/search?first_name=Bob" \
  -H "Authorization: Bearer ALICE_TOKEN"
```

### 4. Alice sends friend request to Bob

```bash
curl -X POST http://localhost:3000/api/v1/friends/requests \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver_id": "BOB_ID"
  }'
```

### 5. Bob views pending requests

```bash
curl http://localhost:3000/api/v1/friends/requests/pending \
  -H "Authorization: Bearer BOB_TOKEN"
```

Save the request ID: `REQUEST_ID`

### 6. Bob accepts the request

```bash
curl -X PATCH http://localhost:3000/api/v1/friends/requests/REQUEST_ID/accept \
  -H "Authorization: Bearer BOB_TOKEN"
```

### 7. Alice views her friends list

```bash
curl http://localhost:3000/api/v1/friends \
  -H "Authorization: Bearer ALICE_TOKEN"
```

Now Alice and Bob are friends! 🎉

## Troubleshooting

### Port already in use

```bash
# Change ports in docker-compose.yml or .env
# Or stop the service using the port
sudo lsof -ti:3000 | xargs kill -9
```

### Database connection failed

```bash
# Check PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Can't access Swagger

- Make sure API is running: http://localhost:3000/api/v1/health
- Check the correct URL: http://localhost:3000/api/docs

### JWT token expired

- Register a new user or login again
- Default expiration is 7 days

## Next Steps

- Read the [full README](README.md) for detailed documentation
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Explore the [Swagger UI](http://localhost:3000/api/docs) for all endpoints
- Customize the `.env` file for your needs
- Set up your own database credentials for production

## Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong secret
- [ ] Update database credentials
- [ ] Configure CORS for your domain
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure logging/monitoring
- [ ] Set up rate limiting
- [ ] Review security settings
- [ ] Run tests
- [ ] Set `NODE_ENV=production`

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f api`
2. Verify environment variables: `cat .env`
3. Check database connection: http://localhost:3000/api/v1/health
4. Review the [README](README.md) and [ARCHITECTURE](ARCHITECTURE.md) docs

Happy coding! 🚀
