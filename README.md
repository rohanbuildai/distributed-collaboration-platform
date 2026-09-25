# Distributed Real-Time Collaboration Platform

A production-oriented distributed backend for real-time collaborative document editing, designed and evolved through practical system-design problems.

The project starts as a simple working system and progressively evolves into a distributed, scalable, fault-tolerant architecture by identifying real bottlenecks, designing solutions, implementing them, and validating them through testing and load experiments.

---

## 1. What Is This Project?

A backend platform where multiple users can collaborate on shared documents in real time.

The long-term system will support:

- User authentication and sessions
- Document creation and access control
- Multiple users editing the same document
- Real-time synchronization
- User presence
- Version history
- Conflict resolution
- Offline/reconnection support
- Horizontal scaling
- Failure handling
- Observability
- Load and stress testing

The goal is **not just to build a collaboration application**, but to understand how the underlying system evolves from a simple backend into a distributed system.

---

## 2. Core Engineering Philosophy

The project follows a **Build → Break → Understand → Design → Implement → Test → Improve** cycle.

For every feature:

```text
Basic working implementation
        ↓
Identify real limitations
        ↓
Understand the relevant system-design concept
        ↓
Design the solution
        ↓
Implement
        ↓
Load/failure test
        ↓
Measure results
        ↓
Document decisions
        ↓
Commit & push

```

We do not introduce technologies simply because they are popular.

Redis, Kafka, WebSockets, load balancers, containers, etc. will be introduced only when a real system requirement justifies them.

---

## 3. Project Goals

### Primary Goals

- Learn system design through implementation
- Build production-quality backend architecture
- Understand concurrency and distributed systems
- Measure system behavior instead of relying on assumptions
- Understand scalability bottlenecks
- Learn how architecture evolves under increasing load
- Build and test failure-resistant systems

### Engineering Goals

- Clean feature-based architecture
- Strong separation of responsibilities
- Database correctness
- Secure authentication
- Concurrency safety
- Performance measurement
- Automated testing
- Load testing
- Observability
- CI/CD
- Horizontal scalability

---

## 4. Technology Stack

### Backend

- Node.js
- Express.js
- JavaScript (CommonJS)

### Database

- PostgreSQL

### Planned Infrastructure

Technologies will be introduced as requirements emerge:

- Redis
- WebSockets
- Message queues / Kafka
- Load balancer
- Docker
- Kubernetes
- Monitoring and observability tools

> Infrastructure choices are driven by engineering requirements rather than technology trends.

---

## 5. Architecture

The application follows a feature-based architecture.

```text
src/
├── modules/
│   ├── auth/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   └── validations/
│   │
│   └── <future features>
│
├── config/
├── middleware/
├── utils/
├── app.js
└── server.js

```

Each feature follows:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Model
  ↓
PostgreSQL

```

### Responsibilities

**Route**

- Defines API endpoints
- Connects requests to controllers

**Controller**

- Handles HTTP concerns
- Parses requests
- Sends responses

**Service**

- Contains business logic
- Coordinates application operations

**Model**

- Handles database queries
- Encapsulates persistence logic

**PostgreSQL**

- Maintains data integrity
- Enforces database-level constraints

---

# 6. System Design Concepts

The project will introduce concepts when they become necessary.

### Foundation

- API design
- Layered architecture
- Database modeling
- Indexing
- Constraints
- Transactions
- Connection pooling
- Error handling

### Concurrency & Consistency

- Race conditions
- Atomicity
- Database isolation
- Optimistic concurrency
- Pessimistic locking
- Idempotency
- Consistency models

### Scalability

- Vertical vs horizontal scaling
- Stateless services
- Load balancing
- Database bottlenecks
- Read replicas
- Caching
- Distributed caching
- Partitioning / sharding

### Distributed Systems

- Service-to-service communication
- Distributed state
- Message queues
- Event-driven architecture
- Kafka
- Eventual consistency
- Distributed coordination
- Failure handling
- Retry strategies
- Dead-letter queues

### Real-Time Systems

- WebSockets
- Connection management
- Presence
- Real-time event delivery
- Ordering
- Reconnection
- Offline synchronization

### Reliability

- Timeouts
- Retries
- Circuit breakers
- Graceful degradation
- Fault isolation
- Backpressure
- Disaster/failure scenarios

### Observability

- Structured logging
- Metrics
- Tracing
- Latency percentiles
- Error rates
- Throughput
- Resource utilization
- System health

---

# 7. Performance Engineering

Every major feature maintains its own performance document.

```text
docs/
└── performance/
    ├── registrationPerformance.md
    ├── loginPerformance.md
    ├── refreshTokenPerformance.md
    ├── documentPerformance.md
    └── ...

```

Each document records:

- Requirements
- Workload assumptions
- Baseline measurements
- Bottlenecks
- Architecture decisions
- Load-test results
- Failure scenarios
- Trade-offs
- Current limitations
- Scaling considerations

Performance claims are based on **measured results**, not assumptions.

---

# 8. Testing Strategy

Testing will happen at multiple levels.

### Functional Testing

Verify that features behave correctly.

### Concurrency Testing

Test simultaneous operations and race conditions.

### Load Testing

Measure:

- Requests/sec
- Throughput
- p50 latency
- p95 latency
- p99 latency
- Error rate
- CPU usage
- Memory usage
- Database behavior

### Failure Testing

Deliberately test:

- Database failures
- Network failures
- Process crashes
- Timeouts
- Duplicate requests
- Partial failures
- Dependency failures

### Current Load Testing Tool

- Artillery

Additional tools may be introduced when required.

---

# 9. Authentication Milestone

Authentication is being engineered as a production subsystem rather than treated as basic CRUD.

### Registration

-  Basic registration endpoint
-  Password hashing
-  Email normalization
-  Database uniqueness constraint
-  Concurrent registration testing
-  Race-condition handling
-  Application-level error handling
-  Global error middleware
-  Input validation
-  Abuse/rate limiting
-  Failure testing
-  Extended load testing
-  Observability
-  Final performance evaluation

### Login

-  Basic login
-  Password verification
-  Access tokens
-  Refresh tokens
-  Token rotation
-  Session management
-  Concurrent session handling
-  Rate limiting
-  Load testing
-  Failure testing
-  Performance documentation

---

# 10. Major Project Milestones

## Milestone 1 — Foundation

-  Project setup
-  PostgreSQL setup
-  Feature-based architecture
-  Git workflow
-  Basic health endpoint

## Milestone 2 — Production Authentication

-  Registration
-  Login
-  Access/refresh token architecture
-  Session management
-  Security hardening
-  Load testing
-  Failure testing
-  Performance documentation

## Milestone 3 — Documents

-  Document creation
-  Document access control
-  Document persistence
-  Concurrent document access
-  Versioning

## Milestone 4 — Real-Time Collaboration

-  WebSocket architecture
-  Real-time document updates
-  Connection management
-  Presence
-  Event ordering
-  Reconnection

## Milestone 5 — Conflict Resolution

-  Concurrent edits
-  Conflict detection
-  Conflict resolution strategy
-  Offline edits
-  Synchronization

## Milestone 6 — Distributed Scaling

-  Multiple application instances
-  Load balancing
-  Shared state
-  Redis where required
-  Message/event infrastructure where required
-  Horizontal scaling

## Milestone 7 — Reliability & Observability

-  Structured logging
-  Metrics
-  Distributed tracing
-  Failure injection
-  Retry strategies
-  Backpressure
-  Graceful degradation

## Milestone 8 — Production Simulation

-  Large-scale load testing
-  Capacity analysis
-  Bottleneck analysis
-  Failure testing
-  Scaling experiments
-  Final architecture documentation

---

# 11. Documentation

```text
docs/
├── architecture/
├── performance/
├── decisions/
└── ...

```

Documentation will evolve with the system rather than being written only at the end.

Important architectural decisions and trade-offs will be recorded as the system evolves.

---

# 12. Current Status

### Current Phase

**Production engineering — Authentication / Registration**

### Completed

- Project foundation
- PostgreSQL integration
- Feature-based architecture
- Registration endpoint
- Password hashing
- Email uniqueness enforcement
- Artillery load testing
- Concurrent registration testing
- Race-condition discovery
- Application error abstraction
- Global error handling
- PostgreSQL constraint error mapping

### Current Finding

Concurrent registrations for the same email were initially able to produce unexpected `500` responses.

The database correctly prevented duplicate users, but the application did not correctly translate PostgreSQL unique-constraint violations.

This was fixed by introducing application-level error handling and mapping the relevant database constraint violation to `409 Conflict`.

Latest concurrency test:

```text
20 concurrent requests
1 × 201 Created
19 × 409 Conflict
0 × 500 Internal Server Error

```

---

# 13. Git Workflow

```text
main
  ↑
develop
  ↑
feature/<feature-name>

```

Development happens on feature branches.

Meaningful engineering changes are committed independently.

Examples:

```text
feat: implement user registration
fix: handle concurrent registration conflicts
test: add registration load test
perf: optimize registration database access
docs: document registration performance

```

A feature is merged into `develop` once its implementation and production-engineering cycle is complete.

`main` represents stable project state.

---

# 14. Long-Term Objective

The final goal is a system where architectural decisions can be explained through actual engineering evidence:

```text
Requirement
    ↓
Baseline
    ↓
Load / Failure
    ↓
Bottleneck
    ↓
System Design
    ↓
Implementation
    ↓
Measurement
    ↓
Trade-off
    ↓
Scalable Architecture

```

The project is complete when the system has evolved from a simple backend into a **measured, scalable, real-time distributed collaboration platform**, and every major architectural decision can be explained by the problem that required it.