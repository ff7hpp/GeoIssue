# ANKAGEO GeoIssue

GeoIssue is a beginner-friendly internship project for reporting city problems on a simple map.
It follows the learning order in the ANKAGEO internship roadmap: HTML/CSS, JavaScript,
React components and state, then Node.js and Express. Firebase will be added later for
database storage and real authentication.

The client currently demonstrates:

- Add a geo-located issue from the form.
- Click the map-style panel to set coordinates.
- Filter issues by category, status, and search text.
- Edit existing issues.
- Remove issues.
- Load and change issue data through a simple Express API.
- Show temporary sign-in and create-account screens.

The design is intentionally simple so the React and CRUD code is easy to read and explain.

## Learning Roadmap

1. **HTML and CSS:** Read the form, table, Flexbox layout, and responsive media query.
2. **JavaScript:** Practice events, arrays, `map`, `filter`, objects, and `fetch`.
3. **React:** Follow how `App` owns UI state and calls the API with `fetch`.
4. **Backend:** Run the Express API and study the five CRUD routes in `server/src/routes`.
5. **Firebase:** Replace the in-memory issue data and temporary client session with Firebase.

The current API stores its three demo issues in a JavaScript array. Data resets when the server
restarts. This keeps the backend readable before Firebase is introduced.

## Project Structure

```text
geoissue/
├── client/          React + Vite frontend, including temporary authentication pages
└── server/          Express API with in-memory issue data
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
npm run dev
```

The client uses `http://localhost:5173` and the API uses `http://localhost:5000`.

## API Routes

- `GET /api/issues`
- `POST /api/issues`
- `PUT /api/issues/:id`
- `DELETE /api/issues/:id`
- `PATCH /api/issues/:id/status`
