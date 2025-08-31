# DevByZero-Platform-9-

## Quick Setup

1) Clone
```bash
git clone https://github.com/DevOps-Malayalam/DevByZero-Platform-9-
cd DevByZero-Platform-9-
```

2) Environment files
- Express backend: `Express-backend/.env`
- Python backend: `Python-backend/.env`
- Frontend: `Frontend/.env` (if used)

Minimum vars to set:
- `MONGODB_URI` (shared by Express and Python backends)
- `JWT_SECRET` (same across services recommended)

3) Start order (priority)
- Start MongoDB service first
- Start backends (order doesn’t matter)
  - Express backend
  - Python backend
- Start Frontend last

## Commands

From each folder:

– Express-backend
```bash
npm install
npm run dev   # or: node server.js

## Troubleshooting
If you get any errors, check the folder-specific README:
  - `Express-backend/README.md`
```

– Python-backend
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload

## Troubleshooting
If you get any errors, check the folder-specific README:
  - `Python-backend/README.md`
```

– Frontend
```bash
npm install
npm run dev   # or: npm start
```
## Troubleshooting
If you get any errors, check the folder-specific README:
  - `Frontend/README.md`

## Ports and URLs (defaults)
- Express API: http://localhost:3001 (or as defined in its README)
- Python API:  http://127.0.0.1:8000
- Frontend:     http://localhost:3000

Ensure the Frontend config points to the running backend URLs.




Also confirm env variables are set in the correct `.env` files and that MongoDB is running.
