# Distributed Collaboration Platform

A backend-focused collaboration platform for creating, managing, and sharing documents. Built as a modular monolith, with an emphasis on secure authentication, authorization, database design, and scalable API patterns.

## Tech Stack

- Node.js, Express.js
- PostgreSQL (`pg`)
- JWT authentication, refresh-token rotation, HTTP-only cookies
- Jest and Supertest

## Features

### Authentication
- Registration and login with bcrypt password hashing
- Access tokens and refresh-token rotation
- Refresh-token reuse detection and token-family revocation
- Logout, protected routes, and rate limiting

### Documents
- Create, read, update, and delete documents
- Owner-based access control
- Cursor-based pagination

### Document Sharing
- Share documents as **Viewer** or **Editor**
- List documents shared with the authenticated user
- Update or revoke sharing permissions
- Owners have full control; editors can read and update; viewers can only read
- Unauthorized users cannot access shared documents

## Architecture

Feature-based layered backend:

```text
src/
├── config/
├── middleware/
├── modules/
│   ├── auth/
│   └── documents/
├── routes/
├── utils/
├── app.js
└── server.js
```

Request flow: `Route → Controller → Service → Model → PostgreSQL`

## API Overview

All endpoints use the `/api/v1` prefix.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Get current user |
| POST | `/documents` | Create document |
| GET | `/documents` | List owned documents |
| GET | `/documents/shared` | List shared documents |
| GET | `/documents/:id` | Get a document |
| PATCH | `/documents/:id` | Update a document |
| DELETE | `/documents/:id` | Delete a document |
| POST | `/documents/:id/share` | Share a document |
| PATCH | `/documents/:id/share/:userId` | Update sharing permission |
| DELETE | `/documents/:id/share/:userId` | Revoke sharing |

Protected endpoints require authentication.

## Getting Started

### Requirements
- Node.js
- PostgreSQL

### Install

```bash
git clone https://github.com/rohanbuildai/distributed-collaboration-platform.git
cd distributed-collaboration-platform
npm install
```

### Configure

Create a `.env` file:

```env
NODE_ENV=development
PORT=3000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=your_database_name
DATABASE_USER=postgres
DATABASE_PASSWORD=your_database_password

JWT_ACCESS_SECRET=your_secret_at_least_32_characters_long
JWT_ACCESS_EXPIRES_IN=15m
```

Apply the SQL files in `database/migrations/` to your PostgreSQL database in order.

### Run

```bash
npm run dev
```

### Test

```bash
npm test -- --runInBand
```

## Project Status

**Completed:** Backend foundation, authentication, refresh-token security, document CRUD, ownership authorization, cursor pagination, document sharing, Viewer/Editor permissions, and automated tests.

**Next:** Real-time collaboration, presence, conflict resolution, distributed messaging, horizontal scaling, and observability.

---

Built incrementally: implement, test, measure, and improve each subsystem.
