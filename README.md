# ACAWS - Local Development

This repository contains three main parts:
- Express backend (Express-backend)
- Python backend (Python-backend)
- Frontend (Frontend)

This README adds concise Linux (Ubuntu/Debian) instructions to run the project locally for development.

Prerequisites
- Node.js (16+ recommended)
- npm
- Python 3.10+ and venv
- MongoDB (local)
- Docker (optional, recommended for running MongoDB)

Quick-start (Linux)

1) Install system packages

```bash
sudo apt-get update && sudo apt-get install -y build-essential curl python3 python3-venv python3-pip git docker.io
```

2) Start MongoDB (choose one):

- Use system MongoDB service if installed

```bash
sudo systemctl start mongodb || sudo systemctl start mongod
```

- Or use Docker (recommended for isolated dev)

```bash
docker run -d -p 27017:27017 --name acaws-mongo mongo:6
```

3) Express backend

```bash
cd Express-backend
npm install
# copy or create a .env with at least MONGODB_URI and JWT_SECRET
cp .env.example .env 2>/dev/null || true
# edit .env to set MONGODB_URI (mongodb://localhost:27017/yourdb) and JWT_SECRET
npm run dev
```

4) Python backend

```bash
cd Python-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env 2>/dev/null || true
# edit .env if necessary
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

5) Frontend

```bash
cd Frontend
npm install --legacy-peer-deps
npm run dev
# open http://localhost:3000
```

Common tips
- If npm install fails with compilation errors, ensure build-essential is installed and that npm uses python3: `npm config set python python3`.
- If you use Docker for MongoDB, make sure to update `MONGODB_URI` in backend .env files to point to `mongodb://host.docker.internal:27017/` on macOS/Windows or `mongodb://localhost:27017/` on Linux.
- Use the dev seeder: `POST /api/tutor/seed-sample` to create sample tutor roadmap data (Express backend must be running).
- Frontend reads API base URLs from `Frontend/.env` (VITE_API_URL and VITE_PY_API_URL).

Troubleshooting
- CORS errors: confirm backend and frontend ports and VITE_API_URL match and that backends allow the frontend origin.
- Authentication redirect loops: check `JWT_SECRET` and token storage in localStorage.

Files of interest
- `Express-backend/scripts/generated_tutor_roadmap.json` — sample 8-chapter roadmap used by the dev seeder.
- Frontend pages: `Frontend/src/pages/Community.jsx`, `Frontend/src/pages/Dashboard.jsx`, `Frontend/src/pages/Learning.jsx`, `Frontend/src/pages/ChapterDetail.jsx`.

If you want, I can add a small script to launch all services with docker-compose for an easier dev start.
