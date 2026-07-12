# Architecture

This repository is organized around a feature-first monorepo layout.

## Ownership

- `shared/database` owns the Prisma schema and shared database client.
- `shared/ui-components` owns cross-screen UI primitives.
- `shared/utils` owns reusable helpers and validation logic.
- Each folder under `features/` owns one business domain and its frontend/backend concerns.
- `entry/main-frontend` owns route wiring and top-level auth guarding.
- `entry/main-backend` owns router composition for the API.
