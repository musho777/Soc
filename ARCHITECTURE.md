# System Architecture Documentation

## Overview

This document describes the architecture, design decisions, and implementation details of the Social Network API.

## Architecture Pattern

### Clean Architecture (Layered Architecture)

The application follows Clean Architecture principles with clear separation of concerns:

```
┌────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│  Controllers: Handle HTTP requests, validation, responses   │
│  DTOs: Define request/response schemas                      │
│  Guards: Protect routes (JWT authentication)                │
│  Decorators: Custom route/parameter decorators              │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│                      Business Layer                         │
│  Services: Business logic, orchestration, validation        │
│  Entities: Domain models                                    │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│                     Data Access Layer                       │
│  Repositories: Data access with raw SQL queries             │
│  Database Service: Connection pooling, transactions         │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│                       Database Layer                        │
│  PostgreSQL: Relational database with optimized schema      │
└────────────────────────────────────────────────────────────┘
```

## Module Structure

### 1. Database Module (Global)

**Purpose**: Provides database connectivity across the application

**Components**:
- `DatabaseService`: Connection pool management, query execution, transactions
- Raw SQL queries using `node-postgres` (pg)
- Connection pooling for performance
- Transaction support for data consistency

**Why no ORM?**
- Direct control over queries for optimization
- Better performance (no ORM overhead)
- Easier to write complex queries
- More transparent SQL execution
- Follows the challenge requirements

### 2. Auth Module

**Purpose**: User authentication and authorization

**Components**:
- `AuthService`: Registration, login, JWT generation
- `JwtStrategy`: Passport strategy for JWT validation
- `JwtAuthGuard`: Global guard for route protection
- Custom decorators: `@Public()`, `@CurrentUser()`

**Flow**:
1. User registers → Password hashed with bcrypt → JWT token issued
2. User logs in → Credentials validated → JWT token issued
3. Protected routes → JWT verified → User extracted from token

**Security Features**:
- Bcrypt password hashing (configurable rounds)
- JWT with expiration
- Global authentication guard (opt-out with @Public())
- Token validation on every request

### 3. Users Module

**Purpose**: User management and search

**Components**:
- `UsersController`: User endpoints (profile, search)
- `UsersService`: Business logic
- `UsersRepository`: Data access with SQL

**Advanced Search Implementation**:
```sql
-- Dynamic WHERE clause building
WHERE is_active = true
  AND first_name ILIKE '%John%'    -- Partial match
  AND last_name ILIKE '%Doe%'
  AND calculate_age(date_of_birth) >= 25
  AND calculate_age(date_of_birth) <= 40
ORDER BY created_at DESC
LIMIT 20 OFFSET 0
```

**Performance Optimizations**:
- Composite indexes on search columns
- ILIKE for case-insensitive search
- Database function for age calculation
- Pagination to limit result sets

### 4. Friends Module

**Purpose**: Friend request and friendship management

**Components**:
- `FriendsController`: Friend endpoints
- `FriendsService`: Business logic
- `FriendsRepository`: Data access with SQL

**Friend Request Workflow**:

```
┌─────────────┐    send     ┌─────────────┐
│   User A    │  ────────►  │   User B    │
└─────────────┘             └─────────────┘
                                   │
                                   │ accept/decline
                                   ▼
                            ┌─────────────┐
                            │  Friendship │
                            └─────────────┘
```

**States**:
- `pending`: Request sent, awaiting response
- `accepted`: Request accepted, users are friends
- `declined`: Request declined
- `blocked`: User blocked

**Key Features**:
- Bidirectional friendship view
- Mutual friends calculation
- Request validation (no self-requests, no duplicates)
- Automatic timestamp updates via triggers

### 5. Health Module

**Purpose**: System health monitoring

**Provides**:
- Database connectivity status
- Connection pool statistics
- Memory usage
- Uptime information

## Database Design

### Schema Principles

1. **Normalization**: 3NF compliance
2. **UUID Primary Keys**: Better for distributed systems
3. **Timestamp Tracking**: Created/updated timestamps on all tables
4. **Soft Deletes**: is_active flag instead of hard deletes
5. **Constraints**: Enforce data integrity at DB level

### Key Design Decisions

#### 1. Friend Requests Table

```sql
CREATE TABLE friend_requests (
    id UUID PRIMARY KEY,
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    status friendship_status,
    UNIQUE (sender_id, receiver_id)  -- Prevent duplicate requests
);
```

**Why this design?**
- Single table for all relationship states
- Unique constraint prevents duplicates
- Easy to query in either direction
- Status changes tracked with timestamps

#### 2. Friendships View

```sql
CREATE VIEW friendships AS
SELECT sender_id AS user_id, receiver_id AS friend_id
FROM friend_requests WHERE status = 'accepted'
UNION ALL
SELECT receiver_id AS user_id, sender_id AS friend_id
FROM friend_requests WHERE status = 'accepted';
```

**Benefits**:
- Bidirectional friendship queries
- No data duplication
- Simple friend list retrieval
- Maintains single source of truth

#### 3. Database Functions

```sql
-- Age calculation
CREATE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN DATE_PART('year', AGE(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Why functions?**
- Consistent age calculation
- Used in queries and constraints
- Better performance (indexed calculations)
- Reusable across queries

### Indexing Strategy

```sql
-- Single column indexes for exact matches
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Composite index for common search patterns
CREATE INDEX idx_users_search ON users(first_name, last_name, date_of_birth)
WHERE is_active = true;

-- Partial indexes for better performance
CREATE INDEX idx_users_is_active ON users(is_active)
WHERE is_active = true;
```

**Index Selection Criteria**:
- Frequently queried columns
- JOIN conditions
- ORDER BY columns
- WHERE clause columns
- Composite indexes for multi-column queries

## Request Flow

### Example: User Search

```
1. HTTP Request
   GET /api/v1/users/search?first_name=John&age_min=25&limit=20
   Authorization: Bearer <jwt-token>

2. NestJS Middleware
   ↓ CORS handling
   ↓ JWT validation (JwtAuthGuard)
   ↓ Request validation (ValidationPipe)

3. Controller Layer (UsersController)
   ↓ Extract query parameters
   ↓ Transform to SearchUsersDto
   ↓ Call service method

4. Service Layer (UsersService)
   ↓ Business logic validation
   ↓ Call repository method

5. Repository Layer (UsersRepository)
   ↓ Build dynamic SQL query
   ↓ Execute with parameters
   ↓ Return mapped results

6. Response Transformation
   ↓ ClassSerializerInterceptor (remove sensitive fields)
   ↓ Format pagination metadata

7. HTTP Response
   {
     "data": [...users],
     "pagination": {
       "page": 1,
       "total": 45,
       "totalPages": 3
     }
   }
```

## Security Architecture

### 1. Authentication Flow

```
Registration:
User Input → Validation → Password Hash → Save to DB → Generate JWT → Return Token

Login:
Credentials → Find User → Verify Password → Update Last Login → Generate JWT → Return Token
```

### 2. Authorization

- Global JWT guard on all routes
- Opt-out with `@Public()` decorator
- User extracted and attached to request
- Access control in service layer

### 3. Input Validation

```typescript
// DTO with validation decorators
class CreateUserDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;

  // ... more validations
}
```

### 4. SQL Injection Prevention

All queries use parameterized statements:

```typescript
// Safe - parameterized query
const query = 'SELECT * FROM users WHERE email = $1';
await db.query(query, [email]);

// NEVER - string concatenation
// const query = `SELECT * FROM users WHERE email = '${email}'`; ❌
```

## Performance Optimizations

### 1. Connection Pooling

```typescript
const pool = new Pool({
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

**Benefits**:
- Reuse database connections
- Limit concurrent connections
- Better resource management
- Faster query execution

### 2. Query Optimization

- Use indexes for frequent queries
- Limit result sets with pagination
- Select only needed columns
- Use EXISTS for existence checks
- Batch operations where possible

### 3. Pagination

```typescript
// Count total (without offset)
SELECT COUNT(*) FROM users WHERE ...

// Get page data
SELECT * FROM users WHERE ...
LIMIT 20 OFFSET 0
```

**Why separate queries?**
- Total count needed for pagination metadata
- Offset on large datasets is fast with proper indexes
- Client knows total pages available

## Error Handling

### Error Flow

```
Error Occurrence
    ↓
Service catches and throws NestJS exception
    ↓
Global Exception Filter catches
    ↓
Format error response
    ↓
Log error (if 5xx)
    ↓
Return formatted JSON to client
```

### Error Response Format

```json
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/users/search",
  "method": "GET",
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Testing Strategy (Recommended)

### Unit Tests
- Service layer business logic
- Repository query building
- DTO validation
- Utility functions

### Integration Tests
- Controller → Service → Repository flow
- Database transactions
- Authentication flow
- Error handling

### E2E Tests
- Complete user workflows
- API endpoint responses
- Database state changes

## Deployment Architecture

### Docker Multi-Stage Build

```
Stage 1: Dependencies
  → Install production dependencies
  → Cache layer for faster builds

Stage 2: Build
  → Install all dependencies
  → Compile TypeScript
  → Generate dist/

Stage 3: Production
  → Copy production dependencies
  → Copy compiled code
  → Run as non-root user
  → Minimal attack surface
```

### Docker Compose Services

```yaml
services:
  postgres:    # Database
  api:         # NestJS application
  pgadmin:     # Database management (optional)
```

## Scalability Considerations

### Horizontal Scaling

The application is stateless and can scale horizontally:

```
          Load Balancer
         /      |      \
      API1    API2    API3
         \      |      /
          PostgreSQL
          (with replication)
```

### Future Enhancements

1. **Caching Layer**
   - Redis for session storage
   - Cache user profiles
   - Cache friend lists

2. **Message Queue**
   - Background jobs (email notifications)
   - Async processing
   - Event-driven architecture

3. **Database Optimization**
   - Read replicas
   - Connection pool per instance
   - Query result caching

4. **Monitoring**
   - Prometheus metrics
   - Grafana dashboards
   - Error tracking (Sentry)

## Coding Standards

### File Naming
- kebab-case for files: `users.service.ts`
- PascalCase for classes: `UsersService`
- Descriptive names: `users.repository.ts`, not `repo.ts`

### Code Organization
- One class per file
- Group by feature (module)
- Separation of concerns
- Dependency injection

### Comments
- JSDoc for public methods
- Inline comments for complex logic
- Explain "why", not "what"

### TypeScript
- Strict mode enabled
- Explicit return types
- No `any` types
- Interface over type when possible

## Conclusion

This architecture provides:
- ✅ Clean separation of concerns
- ✅ Scalable and maintainable code
- ✅ Production-ready security
- ✅ Optimized database performance
- ✅ Comprehensive error handling
- ✅ Easy to test and extend
- ✅ Well-documented codebase

The system is designed to handle real-world production workloads while maintaining code quality and developer experience.
