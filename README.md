# SupportDesk Web

[![CI](https://github.com/AlexisJFranco1575/supportdesk-web/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexisJFranco1575/supportdesk-web/actions/workflows/ci.yml)

Angular frontend for the [SupportDesk API](https://github.com/AlexisJFranco1575/supportdesk-api), a support-ticket
system built with .NET 10 and deployed on Azure. Customers open tickets and follow them; agents and
administrators work them through the Open → In progress → Resolved → Closed workflow.

## Features

- Sign in and account creation against the API's JWT authentication.
- Ticket list with status and priority filters and server-side pagination.
- Ticket creation with validation and server error messages.
- Ticket detail with workflow actions (assign and start, resolve, close, reopen, change priority) shown only to
  agents and administrators.
- Customers only ever see their own tickets: the API enforces it, the UI just reflects it.

## Tech

Angular 22 (standalone components, signals, zoneless change detection, functional guards and interceptors),
TypeScript in strict mode, reactive forms, RxJS, Vitest, GitHub Actions.

## Architecture

```
src/app/
  core/       Auth service, HTTP interceptor, route guards, API services, models, error mapping
  features/
    auth/     Login and registration pages
    tickets/  List, create and detail pages
  shared/     Reusable presentational components
  testing/    Helpers used only by tests
```

- **Session:** the access token is kept in `localStorage` and its claims (id, name, role, expiry) are read in the
  browser to decide what to show. The signature is never trusted client-side: the API validates the token on
  every request, and a `401` signs the user out automatically.
- **Routing:** protected routes use an `authGuard` that remembers where the user was going. After signing in
  the app only follows a return URL that stays inside the app.
- **Errors:** every failure goes through one function that turns problem-details responses, validation errors
  and network failures into short messages.
- **Resilience:** the demo API scales to zero, so the first request can take a few seconds; the UI says so
  instead of failing silently.

## Run locally

Requirements: Node.js 22 or 24 and the [API](https://github.com/AlexisJFranco1575/supportdesk-api) running locally.

```bash
npm install
npm start        # http://localhost:4200
```

The development build calls `http://localhost:5032` (see `src/environments/environment.development.ts`).
The API must allow this origin: set `Cors:AllowedOrigins:0` to `http://localhost:4200` in its configuration.

```bash
npm test         # unit tests (Vitest)
npm run build    # production build in dist/
```

## Known limitations

- The token lives in `localStorage`, which is readable by any script on the page. A production system would
  prefer an `HttpOnly` cookie issued by the API, plus refresh tokens.
- There is no admin screen for changing roles yet: the API has no endpoint to list users.
- No end-to-end browser tests yet.

## License

[MIT](LICENSE)