# Job Tracker API

Express 5 + MongoDB REST API for tracking job applications, with session-cookie
authentication and interactive OpenAPI documentation.

## Requirements

- Node.js 20+
- MongoDB (connection string in `.env` as `MONGO_URL`)

## Setup

```bash
npm install
npm run dev
```

Environment variables (`.env`):

| Variable  | Description                          |
| --------- | ------------------------------------ |
| `PORT`    | HTTP port (default used below: 3000) |
| `NODE_ENV`| `development` / `production`         |
| `MONGO_URL` | MongoDB connection string          |

## API documentation

Swagger UI is served at:

```
http://localhost:3000/api-docs/
```

The spec lives in [`swagger.json`](./swagger.json) (OpenAPI 3.0.3) and is loaded
by `app.js`. It is maintained by hand from the Joi schemas in
`src/validations` and the controller logic — there are no JSDoc annotations.

The docs route is registered after the JSON/cookie parsers and before the
`notFound`, `celebrate` and error-handling middleware. A path-scoped `helmet`
policy relaxes CSP only for `/api-docs` so the Swagger UI assets can load.

## Authentication

Authentication is session-based and cookie-driven. Registering or logging in
creates a `Session` document and sets three `HttpOnly` cookies:

| Cookie         | Lifetime | Purpose                          |
| -------------- | -------- | -------------------------------- |
| `sessionId`    | 7 days   | Identifies the server-side session |
| `accessToken`  | 15 min   | Grants access to protected routes |
| `refreshToken` | 7 days   | Rotates the session via `/auth/refresh` |

Protected endpoints require **both** `sessionId` and `accessToken`. Access is
validated by `src/middleware/authenticate.js`, which returns `401` when the
cookies are missing, the session is unknown, the access token expired, or the
user no longer exists. Use `POST /auth/refresh` before the access token expires;
the old session is deleted and replaced.

Logout deletes the session referenced by `sessionId` (if any) and clears all
three cookies.

## Endpoints

### Auth

| Method | Path             | Description                                    |
| ------ | ---------------- | ---------------------------------------------- |
| POST   | `/auth/register` | Create a user and open a session               |
| POST   | `/auth/login`    | Authenticate and open a session                |
| POST   | `/auth/logout`   | Delete the current session and clear cookies   |
| POST   | `/auth/refresh`  | Rotate the session using the refresh token     |

### Applications (authenticated)

| Method | Path                                  | Description                          |
| ------ | ------------------------------------- | ------------------------------------ |
| GET    | `/applications`                       | List applications (search/filter)    |
| POST   | `/applications`                       | Create an application                |
| GET    | `/applications/{applicationId}`       | Get a single application             |
| PATCH  | `/applications/{applicationId}`       | Partially update an application      |
| DELETE | `/applications/{applicationId}`       | Delete an application                |
| PATCH  | `/applications/{applicationId}/status`| Update only the status               |

Query filters on `GET /applications`:

- `search` — case-insensitive match on `role` and `company`
- `source` — one of `linkedin`, `platsbanken`, `indeed`, `thehub`,
  `company_site`, `referral`, `djinni`, `other`
- `workFormat` — `remote`, `hybrid`, or `onsite`

## Validation

Request bodies, params and query strings are validated with `celebrate`/Joi.
Invalid input returns `400` with a celebrate payload; unknown properties are
rejected. Status values are `applied`, `interview`, `takehome`, `offer` and
`rejected`. Every endpoint documents its Joi constraints (lengths, enums,
patterns, required fields) in the OpenAPI spec.

## Error format

```json
{ "message": "Application not found" }
```

In non-production, `500` responses return the stack trace in `message`.

## Scripts

| Script | Description             |
| ------ | ----------------------- |
| `npm run dev`   | Start with nodemon    |
| `npm start`     | Start with node       |
| `npm test`      | Placeholder (no tests) |
