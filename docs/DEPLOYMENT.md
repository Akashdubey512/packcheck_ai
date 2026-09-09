# PackCheck AI — Deployment & Infrastructure Guide

**Version:** 2.2.0-Production | **Date:** September 9, 2026

---

## 1. Overview & Architecture Stack

PackCheck AI is containerized using multi-stage Docker builds and orchestrated with Docker Compose.

```text
                  ┌──────────────────────────────┐
                  │    Nginx Frontend (Port 80)  │
                  └──────────────┬───────────────┘
                                 │
                     HTTP / REST (Port 5000)
                                 │
                  ┌──────────────▼───────────────┐
                  │   Backend Gateway (Express)  │
                  └───────┬──────────────┬───────┘
                          │              │
             HTTP (Port 8000)      MongoDB (Port 27017)
                          │              │
              ┌───────────▼──┐       ┌───▼──────────┐
              │  AI Service  │       │  Mongo DB    │
              │  FastAPI     │       │  v7.0 Jammy  │
              └──────────────┘       └──────────────┘
```

---

## 2. Environment Variables & Secret Configuration

### Backend Gateway (`backend/.env`)
| Variable | Description | Example / Production Value |
| :--- | :--- | :--- |
| `PORT` | Service binding port | `5000` |
| `NODE_ENV` | Environment mode | `production` |
| `MONGO_URI` | MongoDB connection string | `mongodb://mongodb:27017/legal-metrology-checker` |
| `JWT_SECRET` | Cryptographic secret for signing tokens | *Secrets Manager String* |
| `AI_SERVICE_URL` | URL of the Python AI microservice | `http://ai-service:8000` |
| `FRONTEND_ORIGIN` | Allowed CORS origin | `http://localhost` |
| `UPLOAD_DIR` | Storage path for packaging images | `./uploads` |

### AI Microservice (`ai-service/.env`)
| Variable | Description | Example / Production Value |
| :--- | :--- | :--- |
| `PORT` | FastAPI binding port | `8000` |
| `HOST` | FastAPI binding host | `0.0.0.0` |
| `BACKEND_ORIGIN` | Allowed backend origin | `http://backend:5000` |

---

## 3. Local Production-Like Deployment (Docker Compose)

### Prerequisites
- Docker Engine v24.0+
- Docker Compose v2.20+

### Step-by-Step Launch Commands

```bash
# 1. Clone repository and verify directory structure
cd packcheck_ai

# 2. Build versioned containers (v2.2.0)
docker compose build

# 3. Start stack in detached mode
docker compose up -d

# 4. Verify status of healthcheck probes
docker compose ps
```

### Access Points
- **Frontend App**: [http://localhost](http://localhost)
- **Backend API Gateway**: [http://localhost:5000](http://localhost:5000)
- **AI Microservice**: [http://localhost:8000](http://localhost:8000)
- **Readiness Probes**:
  - Backend: `GET http://localhost:5000/ready`
  - AI Service: `GET http://localhost:8000/ready`

---

## 4. Container Versioning & Rollback Strategy

### Version Tags (`v2.2.0`)
- Backend Gateway: `packcheck-backend:2.2.0`
- AI Microservice: `packcheck-ai:2.2.0`
- Frontend UI: `packcheck-frontend:2.2.0`

### Rollback Procedure
If a regression occurs in a new deployment:

```bash
# 1. Revert container image tags in docker-compose.yml to previous stable version (e.g. 2.1.0)
sed -i 's/2.2.0/2.1.0/g' docker-compose.yml

# 2. Redeploy previous container images cleanly
docker compose up -d --no-deps backend ai-service
```

---

## 5. MongoDB Backup & Disaster Recovery

### Backup Execution

```bash
# Export automated JSON archive dump
docker exec packcheck-mongodb mongodump --db=legal-metrology-checker --out=/data/db/backups/$(date +%Y%m%d)
```

### Restoration Execution

```bash
# Restore archive into isolated database
docker exec packcheck-mongodb mongorestore --db=legal-metrology-checker /data/db/backups/20260909/legal-metrology-checker
```

### RPO & RTO Targets
- **RPO (Recovery Point Objective)**: 1 Hour
- **RTO (Recovery Time Objective)**: 15 Minutes
