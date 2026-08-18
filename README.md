# ANKAGEO GeoIssue

GeoIssue is a React and Express application for reporting map-based city issues.
The current client includes the main MVP flows:

- Add a geo-located issue from the form.
- Click the map-style panel to set coordinates.
- Filter issues by category, status, and search text.
- Edit existing issues.
- Remove issues.
- Change issue status.
- Persist demo client data in `localStorage`.

## Project Structure

```text
geoissue/
├── client/          React + Vite frontend
└── server/          Express + PostgreSQL API scaffold
```

## Run The Client

```bash
cd client
npm install
npm run dev
```

## Run The Server

```bash
cd server
npm install
cp .env.example .env
npm run db:init
npm run dev
```

Set `DATABASE_URL` and `JWT_SECRET` in `server/.env` before running the server.

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/issues`
- `GET /api/issues/:id`
- `POST /api/issues`
- `PUT /api/issues/:id`
- `DELETE /api/issues/:id`
- `PATCH /api/issues/:id/status`
