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