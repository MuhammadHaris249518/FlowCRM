# FlowCRM Docker Setup Guide

FlowCRM is fully containerized using Docker and Docker Compose.

## Architecture

The Docker setup launches 4 coordinated containers on a shared bridge network (`flowcrm-network`):

| Service | Technology | Internal Port | Host Port | Purpose |
|---|---|---|---|---|
| `postgres` | PostgreSQL 16 Alpine | 5432 | 5432 | Database with persistent volume |
| `api` | Node.js / Express / Prisma | 4000 | 4000 | Core REST API & Prisma migrations |
| `ai-service` | Python 3.11 / FastAPI / LangGraph | 8000 | 8000 | Lead scoring & AI email drafting |
| `web` | Next.js 14 Standalone | 3000 | 3000 | Frontend Web App |

---

## Quickstart

### 1. Configure Environment Variables

Copy `.env.docker.example` to `.env` at project root:

```bash
cp .env.docker.example .env
```

Fill in your `GROQ_API_KEY` and Clerk credentials (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`).

### 2. Start all services

Run Docker Compose to build images and launch all services:

```bash
docker compose up --build
```

To run in detached mode (background):

```bash
docker compose up -d --build
```

### 3. Access Services

- **Web Application:** `http://localhost:3000`
- **Node REST API:** `http://localhost:4000`
- **AI Service (FastAPI):** `http://localhost:8000/health`
- **PostgreSQL:** `localhost:5432` (`postgres:postgres`)

---

## Useful Commands

### View Logs
```bash
docker compose logs -f
```

### Stop Services
```bash
docker compose down
```

### Reset Database Volume
```bash
docker compose down -v
```
