# ACAWS Python Backend (FastAPI)

AI/ML microservice for Adaptive Cognitive Access & Wellness System. Provides emotion/attention tracking, wellness, adaptive learning, analytics, and a realtime WebSocket channel.

## Quick Start

- Python 3.12+ recommended
- Create/activate venv
- Install deps
- Run server

```bash
# from Python-backend/
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

Open docs: http://127.0.0.1:8000/docs
Health check: http://127.0.0.1:8000/health

## Environment
Create `Python-backend/.env` and set:

```env
# MongoDB (aligns with Express backend)
MONGODB_URI=mongodb://localhost:27017/acaws
MONGODB_DB_NAME=acaws

# Auth
JWT_SECRET=change_this_to_a_strong_random_secret
JWT_EXPIRE=7d

# Optional
MINIMAL_BOOT=false  # true = skip heavy ML + DB init (for faster dev)
PORT=8000
HOST=0.0.0.0
DEBUG=true
```

Notes:
- `MINIMAL_BOOT=true` uses lightweight stubs and skips Mongo init (good for quick UI/dev runs).
- If `MONGODB_URI` is missing in non-minimal mode, startup will fail.

## Endpoints
Base: `http://127.0.0.1:8000`

- Emotion (`/api/emotion`)
  - POST `/analyze`
  - GET `/trends/{user_id}`
- Attention (`/api/attention`)
  - POST `/track`
  - GET `/trends/{user_id}`
- Adaptive Learning (`/api/learning`)
  - POST `/adapt-content`
  - POST `/generate-path`
  - POST `/recommend-content`
- Wellness (`/api/wellness`)
  - POST `/track-metrics`
  - POST `/suggest-break`
  - GET `/insights/{user_id}`
- Analytics (`/api/analytics`)
  - GET `/dashboard/{user_id}`
  - POST `/generate-report`
- Misc
  - GET `/health`
  - GET `/` (root)
  - GET `/api/protected` (requires JWT)

See `api/routes.py` for request/response bodies.

## Authentication
Most routes use `HTTPBearer` JWT. The token is validated by `core/auth.py`.
- Algorithm: HS256
- Env: `JWT_SECRET`
- The payload should include `userId` (preferred) or `user_id`.

Example header:
```http
Authorization: Bearer <JWT>
```

## Realtime WebSocket
Endpoint: `ws://127.0.0.1:8000/ws/{client_id}`

Send messages like:
```json
{
  "type": "frame_data",
  "frame": "<base64 or placeholder>"
}
```
Server responds with `analysis_result` containing emotion, attention, and fatigue.

## Project Structure
- `app.py` — FastAPI app, lifespan init/cleanup
- `api/routes.py` — REST endpoints
- `core/auth.py` — JWT verification/creation
- `core/websocket_manager.py` — WS connections
- `database/connection.py` — Mongo (Motor) init/close
- `services/*` — ML services (can be heavy)

## Dependencies
See `requirements.txt`. Highlights:
- FastAPI, Uvicorn
- Motor (MongoDB), python-jose/pyjwt, passlib/bcrypt
- TensorFlow, PyTorch, Transformers, OpenCV, NumPy, Pandas, Sklearn, SciPy

Tip: On machines without CUDA or for faster dev, set `MINIMAL_BOOT=true` to avoid loading heavy ML libs.
