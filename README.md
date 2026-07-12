# AssetFlow

AssetFlow is a modular, feature-oriented Enterprise Asset Management system built with Node.js, Express, React (Vite), Tailwind CSS v4, and PostgreSQL via Prisma.

## Prerequisites

To run this project, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (Running locally on default port 5432, or a hosted instance like Supabase)

---

## 1. Installation

Since this project uses a monorepo structure (npm workspaces), you only need to run a single install command at the root of the project to install all dependencies for both the frontend and backend.

Clone the repository and run:
```bash
cd Odoo-2026
npm install
```

---

## 2. Database Setup

We use Prisma as our ORM to manage the PostgreSQL database.

1. **Create the Environment File:**
   Navigate to the database folder and create a `.env` file (if it doesn't already exist):
   ```bash
   # Windows PowerShell
   New-Item -Path "shared\database\.env" -ItemType File
   
   # Mac/Linux
   touch shared/database/.env
   ```

2. **Configure the Connection String:**
   Open `shared/database/.env` and add your PostgreSQL connection string. Replace `your_password` with your local Postgres password.
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/assetflow"
   ```

3. **Push Schema & Generate Client:**
   Navigate to the database directory and run the Prisma commands to create the database (if it doesn't exist), sync the schema, and generate the Prisma Client for the backend.
   ```bash
   cd shared/database
   npx prisma db push --accept-data-loss
   npx prisma generate
   ```

---

## 3. Running the Application

You will need to open **two separate terminal windows**—one for the Frontend and one for the Backend API.

### Starting the Backend Server
From the **root directory** of the project, run:
```bash
node entry/main-backend/server.js
```
*The backend API will start running on http://localhost:4000*

### Starting the Frontend Server
From the **root directory** of the project, run:
```bash
npm run dev --workspace=entry/main-frontend
```
*The frontend Vite server will start on http://localhost:3000*

---

## Architecture

This workspace is scaffolded with a strict feature-oriented monorepo layout:
- `shared/` for Prisma schema, reusable UI components (`ui-components`), and utility modules (`utils`).
- `features/` for individual product domains (e.g., `authentication`, `dashboard`, `assets`, `maintenance`). Each feature contains its own isolated `frontend` and `backend` code.
- `entry/` for the global application entry points (`main-frontend` for Vite/React and `main-backend` for Express).
- `docs/` for architecture notes and reference material.
