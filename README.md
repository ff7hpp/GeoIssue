# ANKAGEO GeoIssue

GeoIssue is a beginner-friendly internship project for reporting city problems on a simple map.
It follows the learning order in the ANKAGEO internship roadmap: HTML/CSS, JavaScript,
React components and state, then Node.js, Express, and PostgreSQL.

The client currently demonstrates:

- Add a geo-located issue from the form.
- Click the map-style panel to set coordinates.
- Filter issues by category, status, and search text.
- Edit existing issues.
- Remove issues.
- Persist demo client data in `localStorage`.

The design is intentionally simple so the React and CRUD code is easy to read and explain.

## Learning Roadmap

1. **HTML and CSS:** Read the form, table, Flexbox layout, and responsive media query.
2. **JavaScript:** Practice events, arrays, `map`, `filter`, objects, and `localStorage`.
3. **React:** Follow how `App` owns the state and sends data/functions to child components with props.
4. **Backend:** Run the Express API and study the CRUD routes in `server/src/routes`.
5. **Database:** Create the PostgreSQL tables with `npm run db:init` and connect the client to the API.

The current client uses `localStorage`, so it can be learned and demonstrated without setting up
the database first. The Express/PostgreSQL code is prepared as the next internship stage.

## Project Structure

```text
geoissue/
├── client/          React + Vite frontend
│   └── src/components/  Form, map, and table components
└── server/          Express + PostgreSQL API
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
