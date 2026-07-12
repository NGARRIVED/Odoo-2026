# AssetFlow

This workspace is scaffolded to match the requested feature-oriented monorepo layout.

## Structure

- `shared/` for Prisma, reusable UI, and utility modules
- `features/` for the individual product domains
- `entry/` for the frontend and backend application entry points
- `docs/` for architecture notes and reference material

## Getting Started

1. Run `npm install` from the repository root.
2. Start both apps with `npm run dev`.
3. Use `npm run dev:frontend` or `npm run dev:backend` if you want a single process.

The frontend runs on Vite at `http://localhost:3000` and the backend listens on port `4000` by default.
