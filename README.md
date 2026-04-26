# TTVV Social Network — Frontend

## Overview

Single-page application for the TTVV Social Network platform, built with React 19 and TypeScript. Communicates with the backend microservices through the API Gateway via REST and WebSocket connections.

## Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | React | 19.2 |
| Language | TypeScript | 5.9 |
| Build Tool | Vite | 6.x |
| Styling | Tailwind CSS | 4.x |
| Routing | React Router DOM | 7.x |
| State Management | Redux + React Context |  |
| Forms | React Hook Form | 7.x |
| HTTP Client | Fetch API (custom HttpClient) |  |
| WebSocket | STOMP.js + SockJS |  |
| Internationalization | i18next + react-i18next |  |
| Icons | Lucide React |  |
| Notifications | React Hot Toast |  |
| Testing | Vitest + Coverage (v8) |  |
| Linting | ESLint 9 + TypeScript ESLint |  |

## Project Structure

```
src/
  apis/              HTTP client, auth service, API config
  components/        Reusable UI components
    ai/              AI assistant chat interface
    auth/            Login, register forms
    chat/            Messaging components
    chatbox/         Floating chat widget
    common/          Shared UI primitives
    layouts/         Page layout wrappers
    navbar/          Top navigation bar
    products/        Marketplace components
    sidebar/         Side navigation
    story/           Story viewer and creator
  contexts/          React context providers
  hooks/             Custom React hooks
  page/              Route-level page components
    admin/           Admin dashboard
    auth/            Authentication pages
    home/            News feed
    messenger/       Full messaging interface
    profile/         User profile pages
    settings/        Account settings
    social/          Social features (friends, groups)
    games/           Entertainment section
    music/           Music player
  redux/             Redux store, slices, actions
  services/          Business logic services (notifications, etc.)
  types/             TypeScript type definitions
  locales/           i18n translation files
  utils/             Utility functions
  constants/         Application constants
```

## Authentication

The application implements a token-based authentication flow with automatic session renewal:

1. **Login/Register** — Credentials are sent to `/api/auth/login` or `/api/auth/register`. Both access token and refresh token are persisted in `localStorage`.

2. **Authenticated Requests** — The custom `HttpClient` (`apis/http.ts`) attaches `Authorization: Bearer <token>` to all outgoing requests.

3. **Automatic Token Refresh** — When a request returns `401 Unauthorized`:
   - The client attempts to refresh the access token using the stored refresh token via `/api/auth/refresh`.
   - A mutex mechanism prevents concurrent refresh calls; queued requests wait for the in-progress refresh to complete.
   - On success, the original request is retried with the new token.
   - On failure, the session is cleared and the user is redirected to the login page.

4. **Logout** — Invalidates the refresh token on the backend (fire-and-forget) and clears all local state.

## API Communication

### REST

All HTTP communication is managed through a centralized `HttpClient` class (`apis/http.ts`) that handles:

- Base URL resolution (Gateway vs. direct service)
- Authorization header injection
- Global error handling with toast notifications
- Automatic 401 recovery (token refresh + retry)

### WebSocket

Real-time features (messaging, notifications, friend status) use STOMP over SockJS, connecting through the API Gateway WebSocket endpoint at `/api/common/ws`.

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
cd UI/socialTTVV
npm install
```

### Run Development Server

```bash
npm run dev
```

The application starts at `http://localhost:5173` and proxies API requests to the Gateway at `http://localhost:8088`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server with HMR |
| `npm run build` | Type-check and build production bundle |
| `npm run lint` | Run ESLint across all source files |
| `npm run test` | Execute test suite (single run) |
| `npm run test:watch` | Execute tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run ci` | Full CI pipeline: lint, test, build |
| `npm run preview` | Preview production build locally |

### Environment Configuration

API base URLs are configured in `src/apis/config.ts`. Default values point to `localhost` for local development:

| Variable | Default | Description |
|----------|---------|-------------|
| `API_CONFIG.BASE_URL` | `http://localhost:8088` | API Gateway address |
| `API_CONFIG.COMMON_SERVICE_URL` | `http://localhost:8081` | Direct CommonService fallback |

## Build and Deployment

```bash
npm run build
```

Outputs static assets to `dist/`. Deploy to any static hosting provider (Vercel, Netlify, Nginx, S3 + CloudFront).

For containerized deployment, serve the `dist/` directory with Nginx or a similar reverse proxy configured to route `/api/*` requests to the API Gateway.
