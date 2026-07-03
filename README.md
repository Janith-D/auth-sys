# Auth System

Full-stack authentication system with JWT access & refresh tokens.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express, MongoDB (Mongoose) |
| **Frontend** | React 19, Redux Toolkit, React Router, Axios |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Security** | Helmet, express-rate-limit, CORS |

## Project Structure

```
├── src/                    # Backend API
│   ├── config/            # Database connection
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Auth & error middleware
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routes
│   ├── utils/             # Token generation, async handler
│   ├── app.js             # Express app setup
│   └── server.js          # Entry point
├── auth-frontend/         # React frontend
│   └── src/
│       ├── api/           # Axios instance & interceptors
│       ├── app/           # Redux store
│       ├── features/auth/ # Auth slice, service, thunks
│       ├── pages/         # Login, Register, Dashboard
│       └── routes/        # Protected route guard
└── README.md
```

## Backend Setup

```bash
# Install dependencies
npm install

# Configure environment
cp src/.env.example src/.env
# Edit .env with your MongoDB URI and JWT secrets

# Start development server
npm run dev
```

## Frontend Setup

```bash
cd auth-frontend
npm install

# Start development server (default: http://localhost:5173)
npm run dev
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login, returns JWT tokens | No |
| POST | `/api/auth/logout` | Revoke refresh token | Yes |
| POST | `/api/auth/refresh-token` | Get new access token | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| GET | `/api/health` | Health check | No |

## Frontend API Integration (Redux)

The frontend uses Redux Toolkit for state management:

- **authService** — Axios calls to the backend API, manages localStorage tokens
- **authSlice** — Redux slice with async thunks (`login`, `register`, `getMe`, `logout`)
- **axiosInstance** — Pre-configured Axios instance with Bearer token interceptor

### Auth Flow

1. User logs in → `POST /api/auth/login`
2. Tokens stored in localStorage, user data in Redux
3. Axios interceptor attaches `Authorization: Bearer <token>` to all requests
4. Dashboard calls `GET /api/auth/me` on refresh to restore session
5. Logout clears localStorage and revokes refresh token

## Environment Variables

### Backend (`src/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `ACCESS_TOKEN_EXPIRE` | Access token TTL (e.g. `15m`) |
| `REFRESH_TOKEN_EXPIRE` | Refresh token TTL (e.g. `7d`) |
| `CLIENT_URL` | Frontend URL for CORS |
| `NODE_ENV` | Environment (`development` / `production`) |
