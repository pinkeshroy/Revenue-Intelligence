# Revenue Intelligence Console

A full-stack Revenue Intelligence Console that helps CROs answer: "Why are we behind (or ahead) on revenue this quarter, and what should we focus on right now?"

![SkyGeni Dashboard](./assets/dashboard-preview.png)

## Features

- **Revenue Summary**: QTD revenue vs target with gap percentage and QoQ change
- **Revenue Drivers**: Pipeline value, win rate, average deal size, and sales cycle trends
- **Risk Factors**: Stale deals, underperforming reps, low activity accounts
- **Recommendations**: AI-generated actionable suggestions with impact metrics
- **Revenue Trend Chart**: Monthly revenue vs target visualization (D3.js)

## Tech Stack

### Backend
- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **Database**: SQLite (via sql.js)
- **Caching**: Redis
- **Containerization**: Docker

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Material UI v5
- **Charts**: D3.js v7
- **HTTP Client**: Axios

### Infrastructure
- Docker & Docker Compose
- Nginx (production serving)
- Redis (caching layer)

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Environment configuration
│   │   ├── database/       # SQLite setup and seeding
│   │   ├── cache/          # Redis client and caching utilities
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API endpoints
│   │   └── types/          # TypeScript interfaces
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API client
│   │   └── types/          # TypeScript interfaces
│   ├── nginx.conf
│   └── Dockerfile
├── data/                   # JSON seed data
├── docker-compose.yml
├── THINKING.md            # Reflection document
└── README.md
```

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd Revenue-Intelligence

# Start all services
docker-compose up --build

# Access the application
open http://localhost:80
```

### Option 2: Local Development

**Prerequisites:**
- Node.js 20+
- npm 9+
- Redis (optional, for caching)

**Backend:**
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:3005
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3000
```

## API Endpoints

### GET /api/summary
Returns current quarter revenue metrics.

```json
{
  "currentQuarterRevenue": 743460,
  "target": 630855,
  "gapPercentage": 17.85,
  "quarterLabel": "Q4 2025",
  "qoqChange": 122.9,
  "monthlyRevenue": [...]
}
```

### GET /api/drivers
Returns revenue driver metrics with trends.

```json
{
  "pipelineValue": { "current": 6365441, "change": 1552047, "trend": [...] },
  "winRate": { "current": 53.03, "change": 11.85, "trend": [...] },
  "avgDealSize": { "current": 37173, "change": 114, "trend": [...] },
  "salesCycle": { "current": 43, "change": -3, "trend": [...] }
}
```

### GET /api/risk-factors
Returns identified risk factors.

```json
[
  {
    "id": "stale-deals-enterprise",
    "type": "stale_deals",
    "description": "274 Enterprise deals stuck over 30 days",
    "severity": "high",
    "count": 274
  }
]
```

### GET /api/recommendations
Returns actionable recommendations.

```json
[
  {
    "id": "focus-enterprise-deals",
    "priority": "high",
    "category": "deals",
    "title": "Focus on aging deals in Enterprise segment",
    "description": "...",
    "impactMetric": "$2058K potential revenue"
  }
]
```

## Data Model

### Entities
- **Accounts**: Customer accounts with industry and segment
- **Reps**: Sales representatives
- **Deals**: Sales opportunities with stage, amount, dates
- **Activities**: Calls, emails, demos linked to deals
- **Targets**: Monthly revenue targets

### Database Schema
```sql
accounts (account_id, name, industry, segment)
reps (rep_id, name)
deals (deal_id, account_id, rep_id, stage, amount, created_at, closed_at)
activities (activity_id, deal_id, type, timestamp)
targets (month, target)
```

## Caching Strategy

Redis is used for caching expensive aggregations:

| Endpoint | Cache Key | TTL |
|----------|-----------|-----|
| /api/summary | summary:q4-2025 | 5 min |
| /api/drivers | drivers:current | 5 min |
| /api/risk-factors | risk-factors | 2 min |
| /api/recommendations | recommendations | 2 min |

**Graceful Degradation**: If Redis is unavailable, the API falls back to direct database queries.

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3005 | Backend server port |
| NODE_ENV | development | Environment mode |
| REDIS_URL | redis://localhost:6379 | Redis connection URL |
| DB_PATH | ./data/revenue.db | SQLite database path |

## Development

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Building for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# Clear volumes (reset database)
docker-compose down -v
```

## Architecture Decisions

See [THINKING.md](./THINKING.md) for detailed explanation of:
- Assumptions made
- Data issues found
- Tradeoffs chosen
- Scalability considerations
- AI usage vs human decisions

## License

This project was created for the SkyGeni Full Stack Engineer assessment.

---

Built with React, TypeScript, Node.js, and D3.js
