# Social Network API

A production-ready backend API for a social networking platform built with **NestJS**, **TypeScript**, and **PostgreSQL** (without ORMs).

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Database Design](#database-design)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Docker Deployment](#docker-deployment)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Project Structure](#project-structure)

## ✨ Features

### Core Functionality

- **User Management**
  - User registration with validation
  - Secure authentication with JWT
  - User profile management
  - Advanced user search with multiple filters

- **Friend System**
  - Send friend requests
  - Accept/decline friend requests
  - View pending and sent requests
  - List friends with pagination
  - Check friendship status
  - Unfriend users

- **Security**
  - JWT-based authentication
  - Password hashing with bcrypt
  - Request validation with class-validator
  - Protected routes with guards

- **Advanced Features**
  - Advanced search (first name, last name, age range)
  - Pagination for all list endpoints
  - Database connection pooling
  - Comprehensive error handling
  - API documentation with Swagger
  - Health check endpoint
  - Docker support for deployment

## 🏗 Architecture

This project follows **Clean Architecture** principles with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│          Controller Layer               │
│  (HTTP requests/responses, validation)  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│           Service Layer                 │
│      (Business logic, orchestration)    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Repository Layer                │
│   (Data access, raw SQL queries)        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Database Layer                 │
│        (PostgreSQL with pg)             │
└─────────────────────────────────────────┘
```

### Design Patterns

- **Repository Pattern**: Centralized data access logic
- **Dependency Injection**: NestJS built-in DI container
- **DTO Pattern**: Request/response validation and transformation
- **Guard Pattern**: Route protection and authorization
- **Decorator Pattern**: Custom decorators for clean code

## 🛠 Tech Stack

### Core Technologies

- **NestJS** (v10.x) - Progressive Node.js framework
- **TypeScript** (v5.x) - Type-safe JavaScript
- **PostgreSQL** (v16) - Relational database
- **node-postgres (pg)** - PostgreSQL client (NO ORM)

### Authentication & Security

- **JWT** - JSON Web Tokens for authentication
- **Passport** - Authentication middleware
- **bcrypt** - Password hashing

### Validation & Documentation

- **class-validator** - DTO validation
- **class-transformer** - Object transformation
- **Swagger/OpenAPI** - API documentation

### DevOps

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 🗄 Database Design

### Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
│    Users     │         │ Friend Requests  │         │    Users     │
├──────────────┤         ├──────────────────┤         ├──────────────┤
│ id (PK)      │◄───────┤ sender_id (FK)   │         │ id (PK)      │
│ email        │         │ receiver_id (FK) ├────────►│ email        │
│ username     │         │ status           │         │ username     │
│ password_hash│         │ created_at       │         │ ...          │
│ first_name   │         │ updated_at       │         └──────────────┘
│ last_name    │         │ responded_at     │
│ date_of_birth│         └──────────────────┘
│ is_active    │
│ is_verified  │
│ created_at   │
│ updated_at   │
└──────────────┘
```

### Key Features

- **UUID Primary Keys** - Better for distributed systems
- **Indexes** - Optimized queries on frequently searched columns
- **CITEXT Email** - Case-insensitive email storage
- **Triggers** - Auto-update timestamps
- **Functions** - Calculate age, check friendship status
- **Views** - Simplified friendship queries
- **Constraints** - Data integrity enforcement

### Database Functions

```sql
-- Calculate age from date of birth
calculate_age(birth_date DATE) → INTEGER

-- Check if two users are friends
are_friends(user1_id UUID, user2_id UUID) → BOOLEAN

-- Get mutual friends count
get_mutual_friends_count(user1_id UUID, user2_id UUID) → INTEGER
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn
- Docker (optional, for containerized deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/musho777/Soc.git
   cd social-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb social_network

   # Run schema migration
   psql -d social_network -f src/database/schema/001_initial_schema.sql
   ```

5. **Start the development server**
   ```bash
   npm run start:dev
   ```

6. **Access the application**
   - API: http://localhost:3000/api
   - Swagger Docs: http://localhost:3000/api/docs

## 📚 API Documentation

### Swagger UI

Interactive API documentation is available at `/api/docs` when the server is running.

Features:
- Try out endpoints directly from the browser
- View request/response schemas
- See authentication requirements
- Test with your JWT token

### Authentication Flow

1. **Register** a new user:
   ```
   POST /api/auth/register
   ```

2. **Login** to get JWT token:
   ```
   POST /api/auth/login
   ```

3. **Use token** for protected endpoints:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Application
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

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d

# Security
BCRYPT_ROUNDS=10
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

Start all services (API + PostgreSQL + pgAdmin):

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Services

- **API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **pgAdmin**: http://localhost:5050
  - Email: admin@admin.com
  - Password: admin

### Using Docker Only

```bash
# Build image
docker build -t social-api .

# Run container
docker run -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PASSWORD=postgres \
  social-api
```

## 📍 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/me` | Get current user profile | Yes |
| GET | `/api/users/search` | Search users | Yes |
| GET | `/api/users/:id` | Get user by ID | Yes |

### Friends

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/friends/requests` | Send friend request | Yes |
| GET | `/api/friends/requests/pending` | Get pending requests | Yes |
| GET | `/api/friends/requests/sent` | Get sent requests | Yes |
| PATCH | `/api/friends/requests/:id/accept` | Accept friend request | Yes |
| PATCH | `/api/friends/requests/:id/decline` | Decline friend request | Yes |
| DELETE | `/api/friends/requests/:id` | Cancel friend request | Yes |
| GET | `/api/friends` | Get friends list | Yes |
| DELETE | `/api/friends/:friendId` | Unfriend user | Yes |
| GET | `/api/friends/status/:userId` | Get friendship status | Yes |

### Health

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check | No |

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Manual Testing with cURL

**Register a user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "username": "johndoe",
    "password": "Password123!",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-05-15"
  }'
```

**Search users:**
```bash
curl -X GET "http://localhost:3000/api/users/search?first_name=John&age_min=25&age_max=40" \
  -H "Authorization: Bearer <your-jwt-token>"
```

**Send friend request:**
```bash
curl -X POST http://localhost:3000/api/friends/requests \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

## 📁 Project Structure

```
social-api/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── decorators/          # Custom decorators (@CurrentUser, @Public)
│   │   ├── guards/              # JWT auth guard
│   │   ├── strategies/          # Passport JWT strategy
│   │   ├── auth.controller.ts   # Auth endpoints
│   │   ├── auth.service.ts      # Auth business logic
│   │   └── auth.module.ts       # Auth module configuration
│   │
│   ├── users/                   # Users module
│   │   ├── dto/                 # Data transfer objects
│   │   ├── entities/            # User entity
│   │   ├── users.controller.ts  # User endpoints
│   │   ├── users.service.ts     # User business logic
│   │   ├── users.repository.ts  # User data access (SQL)
│   │   └── users.module.ts      # Users module configuration
│   │
│   ├── friends/                 # Friends module
│   │   ├── dto/                 # Data transfer objects
│   │   ├── entities/            # Friend request entity
│   │   ├── friends.controller.ts # Friend endpoints
│   │   ├── friends.service.ts   # Friend business logic
│   │   ├── friends.repository.ts # Friend data access (SQL)
│   │   └── friends.module.ts    # Friends module configuration
│   │
│   ├── database/                # Database configuration
│   │   ├── schema/              # SQL schema files
│   │   ├── database.service.ts  # Database connection service
│   │   └── database.module.ts   # Database module
│   │
│   ├── health/                  # Health check module
│   │   ├── health.controller.ts # Health check endpoint
│   │   └── health.module.ts     # Health module
│   │
│   ├── common/                  # Shared resources
│   │   └── filters/             # Exception filters
│   │
│   ├── app.module.ts            # Root application module
│   └── main.ts                  # Application entry point
│
├── docker/                      # Docker configuration
├── test/                        # Test files
├── .env.example                 # Environment variables template
├── .dockerignore                # Docker ignore file
├── .gitignore                   # Git ignore file
├── Dockerfile                   # Docker image definition
├── docker-compose.yml           # Docker Compose configuration
├── nest-cli.json                # NestJS CLI configuration
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## 🎯 Best Practices Implemented

### Code Quality

- ✅ TypeScript strict mode enabled
- ✅ ESLint configuration
- ✅ Prettier code formatting
- ✅ Clean code principles
- ✅ Comprehensive comments and documentation

### Security

- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation with class-validator
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Environment variable management

### Database

- ✅ Connection pooling
- ✅ Optimized indexes
- ✅ Proper constraints
- ✅ Transaction support
- ✅ Database functions for complex queries
- ✅ Raw SQL (no ORM overhead)

### Performance

- ✅ Pagination for large datasets
- ✅ Database query optimization
- ✅ Connection pooling
- ✅ Efficient indexing strategy

### DevOps

- ✅ Docker support
- ✅ Multi-stage Docker builds
- ✅ Health check endpoints
- ✅ Environment-based configuration
- ✅ Production-ready setup

## 🔄 CI/CD Recommendations

This project is ready for CI/CD integration. Recommended pipeline:

```yaml
# Example GitHub Actions workflow
1. Checkout code
2. Install dependencies
3. Run linter
4. Run tests
5. Build Docker image
6. Push to registry
7. Deploy to environment
```

## 📈 Scalability Considerations

- **Horizontal Scaling**: Stateless API design allows multiple instances
- **Database Optimization**: Indexes and connection pooling
- **Caching**: Ready for Redis integration
- **Load Balancing**: Multiple API instances behind a load balancer
- **Microservices**: Modular design allows easy service extraction

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍�💻 Author

**musho777**
- GitHub: [@musho777](https://github.com/musho777)

## 🙏 Acknowledgments

- NestJS team for the amazing framework
- PostgreSQL community
- All open-source contributors

---

**Made with ❤️ using NestJS, TypeScript, and PostgreSQL**
