# Auth System

JWT-based authentication system built with Node.js, Express, and MongoDB.

## Features

- User registration and login
- JWT access & refresh token authentication
- Role-based authorization (user/admin)
- Password hashing with bcryptjs
- Rate limiting & security headers (Helmet)
- MongoDB with Mongoose ODM

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB + Mongoose
- **Auth:** JSON Web Tokens (JWT)
- **Security:** bcryptjs, helmet, express-rate-limit

## Getting Started

```bash
# Install dependencies
npm install

# Create .env file (see .env.example)
# Start the server
npm run dev
```

## API Endpoints

| Method | Endpoint             | Description        | Auth Required |
| ------ | -------------------- | ------------------ | ------------- |
| POST   | `/api/auth/register` | Register a new user | No            |
| POST   | `/api/auth/login`    | Login              | No            |
| POST   | `/api/auth/logout`   | Logout             | Yes           |
| POST   | `/api/auth/refresh`  | Refresh token      | No (cookie)   |
| GET    | `/api/auth/me`       | Get current user   | Yes           |
| GET    | `/`                  | Health check       | No            |

## Environment Variables

| Variable              | Description              |
| --------------------- | ------------------------ |
| `PORT`                | Server port (default 5000) |
| `MONGO_URI`           | MongoDB connection string |
| `JWT_ACCESS_SECRET`   | Access token secret      |
| `JWT_REFRESH_SECRET`  | Refresh token secret     |
| `ACCESS_TOKEN_EXPIRE` | Access token expiry (e.g. 15m) |
| `REFRESH_TOKEN_EXPIRE`| Refresh token expiry (e.g. 7d) |
| `CLIENT_URL`          | CORS origin              |
| `NODE_ENV`            | Environment              |
