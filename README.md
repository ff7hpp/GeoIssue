# GeoIssue

GeoIssue is a simple civic app for reporting local problems such as potholes,
street-light failures, water leaks, and traffic issues.

Users choose a location on the map, describe the problem, and follow its status.
Reports are stored in PostgreSQL and served through a Node.js API.

![GeoIssue report map](output/playwright/geoissue-report.png)

## Built with

- React and Vite
- Node.js and Express
- PostgreSQL
- Leaflet and OpenStreetMap
- Docker and WSL support

## Run locally

```bash
npm ci --prefix server
npm ci --prefix client
docker compose up -d postgres
npm run migrate --prefix server
npm run seed:dev --prefix server
npm run dev
```

Open `http://localhost:5173`.

Keep local `.env` files private. For architecture, API details, database notes,
authentication, deployment, and the study guide, see
[`docs/project/README.md`](docs/project/README.md).
