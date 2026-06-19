# STAC Marine — Intranet Needs Survey

Full-stack survey app with a Node.js/Express API, MongoDB storage, and a built-in admin dashboard.

---

## Project structure

```
stac-survey/
├── index.js              ← Express server (API + static file serving)
├── server/
│   └── model.js          ← Mongoose schema for survey responses
├── public/
│   ├── index.html        ← Survey form (served at /)
│   └── admin/
│       └── index.html    ← Admin dashboard (served at /admin)
├── .env                  ← Your environment variables (create from .env.example)
├── .env.example          ← Template
└── package.json
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and fill in your MongoDB Atlas connection string:
```bash
cp .env.example .env
```

Edit `.env`:
```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/stac_survey?retryWrites=true&w=majority
PORT=3000
```

> Get your connection string from MongoDB Atlas → your cluster → **Connect** → **Drivers** → Node.js.

### 3. Start the server
```bash
npm start
# or for auto-restart during development:
npm run dev
```

### 4. Open in browser
| Page          | URL                          |
|---------------|------------------------------|
| Survey        | http://localhost:3000/       |
| Admin         | http://localhost:3000/admin  |

---

## API endpoints

| Method | Path                         | Description                     |
|--------|------------------------------|---------------------------------|
| POST   | `/api/submit`                | Save a new survey response      |
| GET    | `/api/admin/responses`       | Paginated list of responses     |
| GET    | `/api/admin/responses/:id`   | Single response by ID           |
| DELETE | `/api/admin/responses/:id`   | Delete a response               |
| GET    | `/api/admin/aggregate`       | Aggregated chart data           |

---

## Admin dashboard features

- **Overview** — total responses, support rate, info-struggle rate, responses over time
- **Communication** — Q1/Q2/Q4 charts
- **Business Case** — Q5 rating averages with stacked bar breakdowns, Q7 business problems
- **Feature Priorities** — average ranking across all respondents
- **Concerns** — Q10 concern breakdown
- **Overall Verdict** — Q12 doughnut chart
- **All Responses** — paginated table; click any row to open a full detail drawer with delete option

---

## Deployment notes

- Set `MONGODB_URI` and `PORT` as environment variables on your hosting platform (e.g. Render, Railway, VPS).
- The server serves all static files from `/public`, so no separate frontend build step is needed.
- Make sure your MongoDB Atlas cluster allows connections from your server's IP (Network Access → Add IP).
