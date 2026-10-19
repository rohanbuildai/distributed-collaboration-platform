# Registration Performance

## 1. Baseline

### Test Environment

- Application: Distributed Real-Time Collaboration Platform
- Feature: User Registration
- Load testing tool: Artillery
- Database: PostgreSQL
- Environment: Local development environment

### Test Configuration

- Duration: 10 seconds
- Target arrival rate: 5 requests/second
- Total requests: 50
- Request type: `POST /api/v1/auth/register`
- Email: Randomized per request

### Results

| Metric | Result |
|---|---:|
| Total requests | 50 |
| Successful responses | 50 |
| Failed requests | 0 |
| Mean latency | 247.2 ms |
| p50 latency | 237.5 ms |
| p95 latency | 290.1 ms |
| p99 latency | 361.5 ms |
| Maximum latency | 373 ms |
| Observed request rate | ~7 req/s |

### Initial Observation

The registration endpoint successfully processed all 50
requests in the baseline test with no failed virtual users.

Latency remained below 400 ms for all observed requests.

This result represents a local baseline only and does not
represent the maximum capacity of the system.


## 2. Concurrent Same-Email Test

### Test Configuration

- Total concurrent requests: 20
- Same email used for every request
- Endpoint: `POST /api/v1/auth/register`
- Password hashing: bcrypt
- Database constraint: unique index on `LOWER(email)`

### Results

| Response | Count |
|---|---:|
| 201 Created | 1 |
| 409 Conflict | 14 |
| 500 Internal Server Error | 5 |
| Total | 20 |

### Observation

The PostgreSQL unique constraint successfully prevented
duplicate user creation under concurrent registration.

However, some concurrent requests resulted in HTTP 500
because the application does not currently translate the
PostgreSQL unique-constraint violation into a domain-level
409 Conflict response.

### Identified Issue

Application-level email existence checks are subject to a
race condition:

    SELECT → no user
    INSERT → unique constraint violation

Therefore, the database unique constraint remains the
authoritative mechanism for enforcing email uniqueness.

The application must correctly handle the database
unique-constraint violation and return 409 Conflict.

### Required Improvement

Introduce centralized error handling and map PostgreSQL
unique-constraint violations (`23505`) for the users email
constraint to HTTP 409 Conflict.


## 3. Concurrent Registration Fix

### Initial Problem

The first concurrent same-email test produced:

| Response | Count |
|---|---:|
| 201 Created | 1 |
| 409 Conflict | 14 |
| 500 Internal Server Error | 5 |

The PostgreSQL unique constraint correctly prevented duplicate
records, but concurrent unique-constraint violations were not
being translated into application-level errors.

### Implemented Solution

Implemented:

- Application-level `AppError`
- PostgreSQL unique-constraint detection
- Specific handling for `users_email_unique`
- Global Express error middleware

PostgreSQL constraint violation `23505` for the
`users_email_unique` constraint is translated into:

`409 Conflict - Email already registered`

### Validation Test

Test configuration:

- 20 concurrent requests
- Same previously unused email
- Same registration endpoint
- Same password
- Artillery load test

### Final Results

| Response | Count |
|---|---:|
| 201 Created | 1 |
| 409 Conflict | 19 |
| 500 Internal Server Error | 0 |

### Result

Exactly one registration succeeded and all competing
registrations were handled as controlled `409 Conflict`
responses.

No unexpected server errors occurred.

The PostgreSQL unique constraint remains the authoritative
mechanism preventing duplicate users.

## 4. Rate Limiting

### Objective

Protect the registration endpoint from excessive requests
before they reach expensive operations such as password hashing
and database access.

### Initial Design

The registration endpoint uses an in-memory fixed-window
rate limiter.

Configuration:

- Limit: 10 requests
- Window: 60 seconds
- Rate-limit key: Client IP
- Storage: In-memory JavaScript `Map`
- Exceeded limit response: HTTP 429

Request flow:

    Client
      ↓
    Rate Limiter
      ↓
    Validation
      ↓
    Controller
      ↓
    Service
      ↓
    bcrypt
      ↓
    PostgreSQL

The rate limiter is intentionally placed before validation,
business logic, password hashing, and database operations.

### Load Test Configuration

- Load testing tool: Artillery
- Target arrival rate: 20 requests/second
- Duration: 10 seconds
- Total requests: 200
- Client: Single local client/IP
- Endpoint: `POST /api/v1/auth/register`

### Results

| Response | Count |
|---|---:|
| 201 Created | 10 |
| 429 Too Many Requests | 190 |
| 5xx errors | 0 |
| Total | 200 |

### Response Latency

#### Requests Allowed Through Rate Limiter

| Metric | Result |
|---|---:|
| Mean | 237.5 ms |
| p50 | 232.8 ms |
| p95 | 242.3 ms |
| p99 | 242.3 ms |
| Maximum | 273 ms |

#### Requests Rejected by Rate Limiter

| Metric | Result |
|---|---:|
| Mean | 0.6 ms |
| p50 | 1 ms |
| p95 | 1 ms |
| p99 | 1 ms |
| Maximum | 1 ms |

### Observation

The rate limiter allowed 10 requests from the test client's IP
during the configured window and rejected the remaining 190
requests with HTTP 429.

Rejected requests completed significantly faster than successful
registration requests because they were stopped before reaching
password hashing and database operations.

The test produced zero 5xx responses.

The observed Artillery request rate of approximately 39 requests/sec
must not be interpreted as application capacity. Most requests were
rejected immediately by the rate limiter.

### Retry-After

The rate limiter returns a `Retry-After` response header when the
request limit is exceeded.

This communicates the approximate number of seconds the client
should wait before retrying.

Example:

    HTTP/1.1 429 Too Many Requests
    Retry-After: 47

### Current Limitations

The current rate limiter uses process-local memory.

Therefore:

- Rate-limit state is not shared between application instances.
- Horizontal scaling would create independent rate-limit state
  on each application instance.
- IP records can remain in memory after their windows expire.
- The implementation currently uses a fixed-window algorithm.

These limitations are currently accepted because the application
runs as a single instance.

A shared rate-limit store such as Redis can be evaluated when
horizontal scaling becomes an actual system requirement.

## 4. Database Failure and Recovery

### Failure Test

PostgreSQL was intentionally made unavailable while the
application remained running.

A valid registration request was then sent.

### Result

The database connection failed with `ECONNREFUSED`.

The server returned:

`500 Internal Server Error`

The client received only:

```json
{
  "success": false,
  "message": "Internal server error"
}