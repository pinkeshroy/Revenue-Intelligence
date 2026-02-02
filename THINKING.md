# THINKING.md - Revenue Intelligence Console

## What assumptions did you make?

### Data Assumptions
1. **Current Date Context**: Assumed February 2, 2026 as "today" for all calculations, meaning Q4 2025 (Oct-Dec) is the most recent complete quarter with data.

2. **Revenue Recognition**: Only deals with `stage = 'Closed Won'` AND a valid `closed_at` date contribute to revenue. Deals without amounts are excluded from revenue calculations.

3. **Quarter Definition**: Used standard calendar quarters:
   - Q1: Jan-Mar
   - Q2: Apr-Jun
   - Q3: Jul-Sep
   - Q4: Oct-Dec

4. **Stale Deal Threshold**: Defined "stale" as deals open for more than 30 days without progression. For large deals (>$50K) in negotiation, used 45 days.

5. **Low Activity Threshold**: Accounts with open deals but no recorded activities (calls, emails, demos) in the last 30 days are flagged as low activity.

6. **Rep Performance Baseline**: Reps need at least 5 completed deals (won or lost) to be evaluated. Underperformers are those with win rates more than 20% below the team average.

### Technical Assumptions
1. **Single Data Year**: Data represents 1 year (2025), so YoY comparisons aren't possible; used QoQ instead.

2. **Data Source Trust**: Assumed data integrity despite noted inconsistencies (handled gracefully).

3. **SQLite Suitability**: For the given data scale (600 deals, 250 activities), SQLite is sufficient. The architecture is designed to easily migrate to PostgreSQL.

## What data issues did you find?

### Issues Identified
1. **Nullable Amounts**: Many deals have `amount: null`, especially in early-stage deals (Prospecting). These are excluded from monetary calculations.

2. **Inconsistent closed_at Dates**: Some deals have `closed_at` dates but are not in terminal stages (Closed Won/Lost). For example:
   - Deal D2: Stage "Prospecting" but has `closed_at: "2025-09-13"`
   - This suggests data coming from different systems with different definitions

3. **Missing Activity Data**: Only 250 activities for 600 deals means many deals have no recorded activities, making activity-based analysis incomplete.

4. **No Rep Hierarchy**: Rep data only contains ID and name - no team structure, region, or quota information for deeper analysis.

5. **No Deal Stage History**: Without stage transition timestamps, we can't track deal velocity accurately or identify where deals get stuck.

### How Issues Were Handled
- Null amounts: Filtered out with `amount IS NOT NULL` in queries
- Inconsistent dates: Prioritized `stage` field for determining deal status
- Missing activities: Designed low-activity alerts to be informative, not alarming
- Aggregated data at available levels (rep, segment, industry)

## What tradeoffs did you choose?

### Architecture Tradeoffs

| Decision | Chose | Alternative | Rationale |
|----------|-------|-------------|-----------|
| Database | SQLite via sql.js | PostgreSQL | Simpler setup, sufficient for data scale, portable for assessment |
| ORM | Raw SQL | TypeORM/Prisma | Direct control over queries, better performance for aggregations |
| Caching | Redis | In-memory | Production-ready, scales horizontally, TTL support |
| API Design | REST | GraphQL | Simpler for fixed dashboard requirements, fewer endpoints |
| Charts | D3.js | Chart.js/Recharts | Required by assignment, more control over visualizations |

### Frontend Tradeoffs

| Decision | Chose | Alternative | Rationale |
|----------|-------|-------------|-----------|
| State Management | Local useState | Redux/Zustand | Dashboard is single-page, data flows are simple |
| Data Fetching | Axios | React Query | Sufficient for current needs, simpler setup |
| Styling | Material UI | Tailwind CSS | Required by assignment, provides consistent design system |

### Backend Tradeoffs

| Decision | Chose | Alternative | Rationale |
|----------|-------|-------------|-----------|
| Server | Express | Fastify/Koa | Industry standard, extensive ecosystem |
| Validation | None | Zod/Joi | Assessment scope - would add for production |
| Testing | None | Jest | Time constraint - would add for production |

## What would break at 10× scale?

### Current Scale
- 120 accounts
- 600 deals
- 250 activities
- 15 reps
- 12 monthly targets

### At 10× (1,200 accounts, 6,000 deals, 2,500 activities)

#### Database Performance
**Problem**: Complex aggregation queries (JOINs across 4 tables) would slow down.

**Solutions**:
1. Add proper database indexes (already implemented)
2. Create materialized views for expensive aggregations
3. Migrate to PostgreSQL for better query optimization
4. Implement database connection pooling

#### API Response Times
**Problem**: Each endpoint recalculates metrics from raw data.

**Solutions**:
1. Redis caching (already implemented with TTL)
2. Pre-compute metrics in background jobs
3. Implement incremental updates instead of full recalculations

#### Memory Constraints
**Problem**: sql.js loads entire database into memory.

**Solutions**:
1. Switch to better-sqlite3 (native) or PostgreSQL
2. Implement pagination for list endpoints
3. Stream large result sets

### At 100× (12,000 accounts, 60,000 deals, 25,000 activities)

#### Additional Challenges
1. **Single-threaded Node.js**: Would need clustering or worker threads
2. **Read/Write Contention**: Need read replicas
3. **Cache Invalidation**: Need event-driven invalidation instead of TTL
4. **Frontend Performance**: Virtualized lists, web workers for data processing

#### Recommended Architecture Changes
```
                    Load Balancer
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    Node Server     Node Server     Node Server
         │               │               │
         └───────────────┼───────────────┘
                         │
                   Redis Cluster
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    Primary DB      Read Replica    Read Replica
```

## What did AI help with vs what you decided?

### AI-Assisted Tasks
1. **Code Scaffolding**: Basic project structure, boilerplate (Express setup, React components)
2. **SQL Queries**: Complex aggregations, window functions, JULIANDAY calculations
3. **D3 Charts**: SVG manipulation, scale/axis generation, gradient definitions
4. **Docker Configuration**: Dockerfile best practices, multi-stage builds
5. **TypeScript Types**: Interface definitions matching API contracts
6. **Error Handling Patterns**: Try-catch structures, graceful degradation

### Human Decisions
1. **Business Logic**: 
   - Defining "stale deals" (30 days) vs "at-risk deals" (45 days for large deals)
   - Setting underperformance threshold (20% below average)
   - Recommendation prioritization logic

2. **Architecture**:
   - Choosing sql.js over better-sqlite3 (Windows compatibility)
   - Caching strategy and TTL values
   - API endpoint structure matching assignment requirements

3. **UX/Design**:
   - Color scheme (blue/white with orange accents)
   - Dashboard layout matching reference mockup
   - Information hierarchy (summary banner → drivers → risks → recommendations)

4. **Data Interpretation**:
   - Handling null amounts as "TBD" not "zero"
   - Using Q4 2025 as "current" quarter
   - QoQ comparison instead of YoY

5. **Trade-off Decisions**:
   - Raw SQL over ORM for performance
   - Local state over global state management
   - Simplicity over over-engineering

### Collaboration Pattern
The AI served as a "pair programmer" - providing code suggestions and implementation details while I (the developer) made architectural decisions, defined business rules, and ensured alignment with requirements. Key validation happened through testing the actual API responses against expected business logic.

## Reflection

This project demonstrates a production-minded approach to a time-boxed assessment:
- **Scalable foundation** even though current scale doesn't require it
- **Graceful degradation** (Redis optional, null-safe queries)
- **Clear separation of concerns** (routes → services → database)
- **Documentation-first** thinking for maintainability

Given more time, I would add:
1. Comprehensive test suite (unit + integration)
2. Input validation and sanitization
3. API rate limiting
4. Proper error boundaries in React
5. Accessibility improvements (ARIA labels, keyboard navigation)
6. Performance monitoring (OpenTelemetry)
