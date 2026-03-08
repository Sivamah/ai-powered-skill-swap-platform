# 🚀 AI-Powered Skill Swap Platform

> An intelligent peer-to-peer learning platform where users learn and teach skills with AI-powered matching, quiz-based verification, and credit-based session economy.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://ai-powered-skill-swap-platform.vercel.app)

---

## ✨ Features

- **AI Skill Matching** — TF-IDF vectorisation matches learners with the best tutors for their query
- **Skill Verification** — Three modes: MCQ quiz (10 questions, 70% pass), Coding challenges (Piston API sandboxed execution), Project submission review
- **Credit Economy** — Earn 1 credit by teaching; spend 1 credit to learn — keeps the platform self-sustaining
- **Session Management** — Request, confirm, complete and review sessions with auto Google Meet links
- **Completion Certificates** — Auto-generated on session completion
- **Audit Logging** — Every key action is logged for accountability
- **Demo Mode** — `DEMO_MODE=true` auto-accepts session requests

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.11, FastAPI, SQLite (via SQLModel), Argon2 auth, TF-IDF matcher |
| **Frontend** | React 18, Vite 4, TailwindCSS 3, Monaco Editor, Framer Motion |
| **Auth** | JWT (python-jose), Argon2 password hashing (passlib) |
| **Code Execution** | [Piston API](https://github.com/engineer-man/piston) (sandboxed, no local Docker needed) |

---

## ⚡ Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- (Optional) Microsoft OpenJDK 21 for Java code execution

### 1. Backend

```bash
cd backend
pip install -r requirements.txt

# Set required environment variables
export SECRET_KEY="your-strong-random-secret-key-here"
export ALLOWED_ORIGINS="http://localhost:5173"

# Start the API server
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install

# Configure API URL
cp .env.example .env
# Edit .env and set VITE_API_URL=http://localhost:8000

npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔑 Demo Credentials

| User | Email | Password |
|---|---|---|
| Alex Rivera (Python/React expert) | demo1@skillswap.com | Demo@123 |
| Jordan Lee (Java/ML expert) | demo2@skillswap.com | Demo@123 |

---

## 🌍 Environment Variables

### Backend (`backend/.env`)
```
SECRET_KEY=your-strong-random-secret-key          # REQUIRED in production
ALLOWED_ORIGINS=https://your-frontend-domain.com  # Comma-separated list
DATABASE_PATH=database.db                          # Default: database.db
ACCESS_TOKEN_EXPIRE_MINUTES=60                     # Default: 60
DEMO_MODE=false                                    # Set true for demos
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:8000
```

---

## 🚀 Deployment

### Backend (Render / Railway / Fly.io)
1. Set all environment variables listed above
2. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. For production at scale, consider migrating from SQLite → PostgreSQL

### Frontend (Vercel)
1. Connect the `frontend/` directory to Vercel
2. Set `VITE_API_URL` in Vercel Environment Variables → your backend URL
3. Vercel auto-builds on push to `main`

---

## 📁 Project Structure

```
AI POWERED/
├── backend/
│   ├── main.py           # FastAPI app, all endpoints
│   ├── auth.py           # JWT + Argon2 authentication
│   ├── models.py         # SQLModel database schemas
│   ├── database.py       # DB engine (WAL mode, FK enforcement)
│   ├── ai_engine.py      # TF-IDF skill matcher + AI logic
│   ├── quiz_engine.py    # MCQ question generation
│   ├── coding_engine.py  # Coding challenge + Piston API executor
│   ├── migrations.py     # Lightweight SQLite column migrations
│   ├── seed_data.py      # Demo user seeding
│   └── requirements.txt  # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── App.jsx                        # Root app, routing, nav
    │   ├── main.jsx                       # Entry point, Axios interceptors
    │   ├── pages/                         # Dashboard, FindTutor, MySessions, etc.
    │   ├── components/                    # Login, Register, Modals, SpaceBackground
    │   └── services/api.js                # Centralised Axios instance
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🔐 Security Notes

- JWT tokens expire after 60 minutes by default
- Passwords hashed with Argon2 (industry best practice)
- CORS restricted to configured origins in production
- All authentication via Bearer tokens; no cookies

---

## 📜 License

MIT — Free to use and modify.
