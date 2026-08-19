# ANKAGEO GeoIssue

GeoIssue is a beginner-friendly internship project for reporting city problems on a real map. The code is intentionally simple so each frontend and backend step is easy to review.

## Current Features

- Firebase email/password registration, sign-in, and sign-out
- Persistent light and dark themes using a restrained 60-30-10 color system
- Live Leaflet map with OpenStreetMap tiles
- Browser location button and map-click coordinate selection
- Readable nearest-address confirmation after clicking the map
- Explicit place search through the backend using Nominatim
- Common university abbreviations such as `uni` are expanded when a search has no result
- Add, edit, remove, filter, and update issue status
- Firebase-token protection for every write request
- Neon PostgreSQL storage when `DATABASE_URL` is configured
- Public read-only issue list

Without `DATABASE_URL`, the API uses temporary in-memory demo data. With Neon configured, reports are stored permanently in PostgreSQL.

## Project Structure

```text
geoissue/
|-- client/   React + Vite frontend
`-- server/   Express API, Neon repository, Firebase checks, and geocoding proxy
```

## Firebase Setup

1. In Firebase Console, open **Authentication > Sign-in method**.
2. Enable **Email/Password**.
3. Copy `client/.env.example` to `client/.env` and add the Firebase web values.
4. Download a Firebase Admin service-account JSON file and keep it outside Git.
5. Copy `server/.env.example` to `server/.env` and set its path in `GOOGLE_APPLICATION_CREDENTIALS`.

Service-account JSON files and `.env` files are ignored by Git. Never publish them.

## Run Locally

Start the API:

```bash
cd server
npm install
npm run dev
```

Start the client in a second terminal:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs at `http://localhost:5000`.

The **Use exact location** button requires browser location permission. It works on localhost during development and requires HTTPS after deployment. A phone with GPS normally gives a more accurate result than a desktop computer. If permission or GPS is unavailable, the interface offers an approximate city location based on the user's IP; click the map afterward to mark the exact issue position.

## API Routes

- `GET /api/health` - API and database connection status
- `GET /api/issues` - public
- `GET /api/geocode?q=Ankara` - public, cached place search
- `POST /api/issues` - signed-in user
- `PUT /api/issues/:id` - issue owner
- `PATCH /api/issues/:id/status` - issue owner
- `DELETE /api/issues/:id` - issue owner

## Neon PostgreSQL Setup

1. Create a Neon project and open its **Connect** dialog.
2. Enable connection pooling and copy the PostgreSQL connection string.
3. Put the private value in `server/.env`:

```env
DATABASE_URL=postgresql://user:password@your-endpoint-pooler.neon.tech/database?sslmode=require
```

4. Create the tables and indexes:

```bash
cd server
npm run db:migrate
```

5. Restart the API and open `http://localhost:5000/api/health`. It should report `"mode": "neon"` and `"connected": true`.

Never place the Neon connection string in frontend code or commit `server/.env` to Git.
