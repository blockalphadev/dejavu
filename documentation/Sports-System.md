# Sports Prediction Market System Documentation

> Comprehensive technical documentation for the Sports Data Scraping, Prediction Market Integration, and Real-time Streaming System.

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [API Integration](#api-integration)
6. [RabbitMQ Messaging](#rabbitmq-messaging)
7. [Frontend Integration](#frontend-integration)
8. [Market Resolution](#market-resolution)
9. [Security & Rate Limiting](#security--rate-limiting)
10. [Deployment](#deployment)

---

## System Overview

The Sports Prediction Market System enables users to create and trade prediction markets based on real-time sports data. It integrates with external APIs (TheSportsDB, API-Football) to fetch live sports data, processes events through RabbitMQ for real-time distribution, and provides a professional frontend experience.

### Key Features
- **12 Supported Sports**: AFL, Baseball, Basketball, Football, Formula 1, Handball, Hockey, MMA, NBA, NFL, Rugby, Volleyball
- **Real-time Updates**: WebSocket streaming via Socket.io
- **Anti-Throttling**: Built-in rate limiting and request management
- **Market Resolution**: Automatic market settlement based on event outcomes
- **Mobile-first Design**: Responsive UI optimized for all devices

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                │
│  ┌─────────────────┐              ┌─────────────────┐              │
│  │  TheSportsDB    │              │  API-Football   │              │
│  │  (12 Sports)    │              │  (Soccer Focus) │              │
│  └────────┬────────┘              └────────┬────────┘              │
└───────────┼────────────────────────────────┼────────────────────────┘
            │                                │
            ▼                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (NestJS API)                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Sports Module                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │   │
│  │  │ TheSportsDB  │  │ API-Football │  │    Sports    │       │   │
│  │  │   Client     │  │    Client    │  │   Gateway    │       │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │   │
│  │         │                 │                 │ WebSocket     │   │
│  │         ▼                 ▼                 ▼               │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │              Sports Sync Service                       │ │   │
│  │  │  • Scheduled Jobs  • Data Transformation  • Logging   │ │   │
│  │  └────────────────────────┬───────────────────────────────┘ │   │
│  │                           │                                 │   │
│  │                           ▼                                 │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │                 Sports Service                         │ │   │
│  │  │  • CRUD Operations  • Market Creation  • Resolution   │ │   │
│  │  └────────────────────────┬───────────────────────────────┘ │   │
│  └───────────────────────────┼─────────────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    Supabase     │  │    RabbitMQ     │  │    Frontend     │
│   (PostgreSQL)  │  │   (Messaging)   │  │   (React/Vite)  │
│                 │  │                 │  │                 │
│ • sports_leagues│  │ • sports.events │  │ • SportsCategory│
│ • sports_teams  │  │ • sports.live   │  │ • useSportsData │
│ • sports_events │  │ • sports.resolve│  │ • useSportsRT   │
│ • sports_markets│  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Database Schema

### File Location
`apps/api/supabase/migrations/013_sports_data.sql`

### Tables

#### `sports_leagues`
Stores league/competition information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| external_id | VARCHAR(100) | ID from external API |
| sport | sport_type | Sport enum (afl, baseball, etc.) |
| name | VARCHAR(255) | League name |
| country | VARCHAR(100) | Country of origin |
| logo_url | TEXT | League logo URL |
| is_active | BOOLEAN | Whether league is active |
| is_featured | BOOLEAN | Featured on homepage |
| data_source | data_source | API source (thesportsdb, api_football) |

#### `sports_teams`
Stores team information with branding.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| league_id | UUID | FK to sports_leagues |
| external_id | VARCHAR(100) | ID from external API |
| name | VARCHAR(255) | Team name |
| name_short | VARCHAR(50) | Abbreviated name |
| logo_url | TEXT | Team logo URL |
| primary_color | VARCHAR(7) | Hex color code |
| stadium | VARCHAR(255) | Home stadium name |

#### `sports_events`
Stores matches/fixtures with live scores.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| league_id | UUID | FK to sports_leagues |
| home_team_id | UUID | FK to sports_teams |
| away_team_id | UUID | FK to sports_teams |
| external_id | VARCHAR(100) | ID from external API |
| name | VARCHAR(255) | Event display name |
| start_time | TIMESTAMPTZ | Scheduled start time |
| status | event_status | scheduled, live, finished, etc. |
| status_detail | VARCHAR(100) | "45' - First Half" |
| home_score | INTEGER | Home team score |
| away_score | INTEGER | Away team score |
| venue | VARCHAR(255) | Event venue |
| has_market | BOOLEAN | Has prediction market |
| metadata | JSONB | Additional data |

#### `sports_markets`
Stores prediction markets linked to events.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| event_id | UUID | FK to sports_events |
| market_id | UUID | FK to main markets table |
| market_type | sports_market_type | winner, spread, total, prop |
| title | VARCHAR(255) | Market question |
| outcomes | JSONB | Possible outcomes |
| outcome_prices | JSONB | Current prices |
| resolved | BOOLEAN | Whether resolved |
| outcome | BOOLEAN | Resolution outcome |
| closes_at | TIMESTAMPTZ | Betting deadline |

#### `sports_sync_logs`
Audit trail for all sync operations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| sync_type | VARCHAR(50) | leagues, events, live, etc. |
| sport | sport_type | Sport being synced |
| data_source | data_source | API used |
| status | sync_status | pending, running, success, failed |
| records_created | INTEGER | New records count |
| records_updated | INTEGER | Updated records count |
| error_message | TEXT | Error details if failed |
| started_at | TIMESTAMPTZ | Sync start time |
| completed_at | TIMESTAMPTZ | Sync completion time |

### Enums

```sql
CREATE TYPE sport_type AS ENUM (
    'afl', 'baseball', 'basketball', 'football', 
    'formula1', 'handball', 'hockey', 'mma', 
    'nba', 'nfl', 'rugby', 'volleyball'
);

CREATE TYPE event_status AS ENUM (
    'scheduled', 'live', 'halftime', 'finished', 
    'postponed', 'cancelled', 'suspended'
);

CREATE TYPE data_source AS ENUM (
    'thesportsdb', 'api_football', 'manual'
);

CREATE TYPE sports_market_type AS ENUM (
    'winner', 'spread', 'total', 'prop', 'custom'
);
```

### Key Database Functions

```sql
-- Get upcoming events for a sport
SELECT * FROM get_upcoming_events('nba', 10);

-- Get live events
SELECT * FROM get_live_events('football');

-- Auto-resolve market based on event outcome
SELECT auto_resolve_sports_market(market_id, TRUE);
```

---

## Backend Implementation

### Module Structure

```
apps/api/src/modules/sports/
├── clients/
│   ├── base-sports.client.ts     # Base class with rate limiting
│   ├── thesportsdb.client.ts     # TheSportsDB API client
│   ├── api-football.client.ts    # API-Football client
│   └── index.ts
├── dto/
│   ├── sports.dto.ts             # Request/Response DTOs
│   └── index.ts
├── types/
│   └── sports.types.ts           # TypeScript types & Zod schemas
├── sports.module.ts              # NestJS module
├── sports.controller.ts          # REST endpoints
├── sports.service.ts             # Business logic
├── sports-sync.service.ts        # Sync orchestration
├── sports-messaging.service.ts   # RabbitMQ publishers
├── sports-cleaner.service.ts     # Data validation & deduplication
└── sports.gateway.ts             # WebSocket gateway for real-time streaming
```

### Key Services

#### SportsService
Core business logic for CRUD operations.

```typescript
class SportsService {
  // Get paginated events with filters
  async getEvents(query: SportsEventsQuery): Promise<PaginatedResponse<SportsEvent>>;
  
  // Get live events for a sport
  async getLiveEvents(sport?: SportType): Promise<SportsEvent[]>;
  
  // Create a prediction market from an event
  async createMarketFromEvent(eventId: string, dto: CreateSportsMarketDto): Promise<SportsMarket>;
  
  // Resolve a market based on event outcome
  async resolveMarket(marketId: string, outcome: boolean): Promise<SportsMarket>;
}
```

#### SportsCleanerService

Responsible for the **Transform** phase of the ETL pipeline. Ensures data integrity before storage.

**Pipeline Steps:**
1.  **Validation**: strict checks for required fields (start time, team names, sport type).
2.  **Normalization**: Standardizes team names (e.g., "Man Utd" -> "Manchester United", "PSG" -> "Paris Saint-Germain").
3.  **Deduplication**: Identifies duplicate events across multiple sources using fuzzy matching on team names and match dates. source reliability scoring determines which version to keep.

```typescript
// Deduplication Logic
deduplicateEvents(events: SportsEvent[]): SportsEvent[] {
    const seen = new Map<string, SportsEvent>();
    for (const event of events) {
        // Create unique key based on teams and date
        const key = `${event.homeTeamId}-${event.awayTeamId}-${event.startTime.toDateString()}`;
        if (!seen.has(key) || this.isMoreReliable(event, seen.get(key))) {
            seen.set(key, event);
        }
    }
    return Array.from(seen.values());
}
```

#### SportsSyncService
Orchestrates fully automated data synchronization using NestJS `@Cron` decorators.

**Key Features:**
- **Automated Scheduling**:
  - `Live Scores`: Every 5 minutes (`*/5 * * * *`)
  - `Upcoming Events`: Every hour (`0 * * * *`)
  - `Leagues`: Daily at midnight (`0 0 * * *`)
- **Incremental Sync**: Fetches only new/updated data to minimize API usage.
- **Error Recovery**: Automatic retries and error logging via `sports_sync_logs`.

```typescript
// Cron implementation example
@Cron(CronExpression.EVERY_5_MINUTES)
async handleLiveSync() {
    if (!this.shouldRunSync()) return;
    await this.syncLiveScores();
}
```

#### SportsGateway
Handles real-time data broadcasting to frontend clients.

- **Technology**: Socket.io / `@nestjs/websockets`
- **Integration**: Subscribes to `SportsMessagingService` events.
- **Rooms**:
  - `sport:{sportName}`: Updates for specific sport.
  - `event:{eventId}`: Updates for specific match.
  - `sport:live`: aggregated live scores.

```typescript
@SubscribeMessage('subscribe_live')
handleSubscribeLive(client: Socket, payload: any) {
    client.join('live');
}

// Broadcasts updates when SportsService emits an event
broadcastEventUpdate(event: any) {
    this.server.to(`event:${event.id}`).emit('sports.update', event);
}
```

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sports/categories` | List all sport categories |
| GET | `/api/sports/leagues` | Get leagues (paginated) |
| GET | `/api/sports/leagues/:id` | Get single league |
| GET | `/api/sports/events` | Get events (paginated, filterable) |
| GET | `/api/sports/events/live` | Get live events only |
| GET | `/api/sports/events/upcoming` | Get upcoming events |
| GET | `/api/sports/events/:id` | Get single event with details |
| GET | `/api/sports/markets` | Get sports markets |
| POST | `/api/sports/markets` | Create market from event (Admin) |
| POST | `/api/sports/sync/leagues` | Trigger league sync (Admin) |
| POST | `/api/sports/sync/events` | Trigger event sync (Admin) |

---

## API Integration

### TheSportsDB

**Base URL**: `https://www.thesportsdb.com/api/v1/json/{API_KEY}/`

**Supported Sports**: All 12 (AFL, Baseball, Basketball, Football, Formula 1, Handball, Hockey, MMA, NBA, NFL, Rugby, Volleyball)

**Key Endpoints Used**:
- `search_all_leagues.php?s={sport}` - Get leagues
- `lookup_all_teams.php?id={league_id}` - Get teams
- `eventsnextleague.php?id={league_id}` - Upcoming events
- `eventspastleague.php?id={league_id}` - Past events
- `livescore.php?s={sport}` - Live scores

**Rate Limiting**: 
- Free tier: 3 req/min
- Implementation: Token bucket with 1000ms delay between requests

### API-Football

**Base URL**: `https://v3.football.api-sports.io/`

**Headers**:
```
x-rapidapi-key: {API_KEY}
x-rapidapi-host: v3.football.api-sports.io
```

**Supported Sports**: Football/Soccer only (more detailed data)

**Key Endpoints Used**:
- `GET /leagues` - Competition data
- `GET /teams?league={id}&season={year}` - Teams in league
- `GET /fixtures?live=all` - Live matches
- `GET /fixtures?league={id}&season={year}` - Fixtures
- `GET /odds?fixture={id}` - Betting odds

**Rate Limiting**:
- 300 requests/day (free tier)
- Implementation: Request counting with daily reset

### Data Transformation

Both APIs return different data structures. The sync service normalizes them:

```typescript
// TheSportsDB event → Internal SportsEvent
function transformTheSportsDBEvent(raw: any): SportsEvent {
  return {
    externalId: raw.idEvent,
    name: raw.strEvent,
    homeTeamId: raw.idHomeTeam,
    awayTeamId: raw.idAwayTeam,
    startTime: new Date(raw.strTimestamp || `${raw.dateEvent}T${raw.strTime}`),
    status: mapStatus(raw.strStatus),
    homeScore: parseInt(raw.intHomeScore) || 0,
    awayScore: parseInt(raw.intAwayScore) || 0,
    // ... more fields
  };
}
```

---

## RabbitMQ Messaging

### Configuration

**File**: `packages/messaging/src/`

### Exchanges

| Exchange | Type | Purpose |
|----------|------|---------|
| `dejavu.sports` | topic | Sports event routing |
| `dejavu.domain.events` | topic | General domain events |

### Routing Keys

```typescript
const ROUTING_KEYS = {
  // Sports events
  SPORTS_EVENT_CREATED: 'sports.event.created',
  SPORTS_EVENT_UPDATED: 'sports.event.updated',
  SPORTS_EVENT_LIVE: 'sports.event.live',
  SPORTS_EVENT_FINISHED: 'sports.event.finished',
  
  // Markets
  SPORTS_MARKET_CREATED: 'sports.market.created',
  SPORTS_MARKET_RESOLVED: 'sports.market.resolved',
  SPORTS_ODDS_UPDATED: 'sports.odds.updated',
  
  // Wildcards
  ALL_SPORTS_EVENTS: 'sports.*',
};
```

### Queues

| Queue | Binding | Purpose |
|-------|---------|---------|
| `sports.events.queue` | `sports.event.*` | General event processing |
| `sports.live.queue` | `sports.event.live` | High-priority live updates |
| `sports.resolution.queue` | `sports.market.resolved` | Market settlement |
| `sports.dlq` | Dead letter | Failed message handling |

### Message Flow

```
1. Sync Service fetches new data
       │
       ▼
2. Publishes to RabbitMQ
   { exchange: 'dejavu.sports', routingKey: 'sports.event.updated', message: {...} }
       │
       ▼
3. Sports Gateway subscribes to queue
       │
       ▼
4. Broadcasts to WebSocket clients
   io.to('sport:nba').emit('sports.update', eventData)
       │
       ▼
5. Frontend receives and updates UI
```

---

## Frontend Integration

### Service Layer

**File**: `apps/web/src/services/sports.service.ts`

```typescript
class SportsApiService {
  // Fetch events with pagination
  async getEvents(params?: SportsEventsQuery): Promise<PaginatedResponse<SportsEvent>>;
  
  // Fetch live events
  async getLiveEvents(sport?: SportType): Promise<SportsEvent[]>;
  
  // Fetch upcoming events
  async getUpcomingEvents(sport?: SportType, limit?: number): Promise<SportsEvent[]>;
}

export const SportsService = new SportsApiService();
```

### React Hooks

#### useSportsData
Fetches and manages sports data with auto-refresh.

```typescript
const { events, liveEvents, loading, error, refresh } = useSportsData({
  sport: 'nba',
  autoRefresh: true,
  refreshInterval: 60000 // 1 minute
});
```

#### useSportsRealtime
Connects to WebSocket for live updates.

```typescript
const { isConnected } = useSportsRealtime({
  activeSport: 'live',
  onEventUpdate: (event) => {
    // Handle real-time update
    console.log('Live update:', event);
  }
});
```

#### useSportsSocket
Custom hook for managing WebSocket connections and real-time subscriptions.

```typescript
const { isConnected, joinRoom, leaveRoom } = useSportsSocket({
    sport: 'football',
    onEventUpdate: (update) => {
        console.log('Received live update:', update);
        // Optimistically update UI
    }
});
```

### Components

#### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| `SportsMarketPage` | `SportsMarketPage.tsx` | Main page with all sports components integrated |
| `SportsPredictionCard` | `SportsPredictionCard.tsx` | Polymarket-style prediction card with Yes/No buttons |
| `BetSlip` | `BetSlip.tsx` | Desktop sidebar for managing selections |
| `MobileBetSlip` | `MobileBetSlip.tsx` | Mobile bottom sheet for bet management |
| `SportsSidebar` | `SportsSidebar.tsx` | Navigation for 12 sports categories |
| `SportsTicker` | `SportsTicker.tsx` | Live scores ticker |
| `SportsCard` | `SportsCard.tsx` | Basic event card |

#### SportsPredictionCard

Premium Polymarket-style prediction card with:

```tsx
interface PredictionMarket {
  id: string;
  eventId: string;
  question: string;
  homeTeam: { name: string; logo?: string; score?: number };
  awayTeam: { name: string; logo?: string; score?: number };
  sport: string;
  league?: string;
  status: 'scheduled' | 'live' | 'halftime' | 'finished';
  statusDetail?: string;
  yesPrice: number;    // 0.00 - 1.00
  noPrice: number;     // 0.00 - 1.00
  volume: number;
  participants: number;
  isFeatured?: boolean;
}
```

**Features:**
- Team matchup display with logos
- Live score indicators (pulsing red dot)
- Yes/No prediction buttons with dynamic pricing
- Glassmorphism design
- Volume and participant stats
- Featured badge for hot markets

```tsx
<SportsPredictionCard
  market={market}
  onPredict={(marketId, outcome) => addToSlip(marketId, outcome)}
  variant="featured"
/>
```

#### BetSlip

Desktop sidebar for managing predictions:

```tsx
interface BetSelection {
  id: string;
  marketId: string;
  question: string;
  outcome: 'yes' | 'no';
  price: number;
}

<BetSlip
  selections={betSelections}
  onRemove={(id) => removeSelection(id)}
  onClearAll={() => clearAllSelections()}
  onPlaceBet={(selections, amounts) => placeBet(selections, amounts)}
  balance={userBalance}
/>
```

**Features:**
- Selection management with remove buttons  
- Amount input with quick-add buttons (+$5, +$10, +$25)
- Automatic payout calculations
- Balance validation with warning
- Submit button with loading state

#### MobileBetSlip

Floating bottom bar for mobile with expandable full bet slip:

```tsx
<MobileBetSlip
  selections={betSelections}
  onRemove={handleRemove}
  onClearAll={handleClearAll}
  onPlaceBet={handlePlaceBet}
  balance={userBalance}
/>
```

**Features:**
- Collapsed bar showing selection count
- Positioned above mobile navigation
- Swipe/tap to expand into full bet slip
- Backdrop overlay when expanded

---

## Market Resolution

### Automatic Resolution Flow

```
1. Event finishes (status = 'finished')
       │
       ▼
2. Sync service detects final score
       │
       ▼
3. Find linked sports_markets
       │
       ▼
4. Determine outcome based on market_type:
   • winner: homeScore > awayScore
   • spread: (homeScore - awayScore) > spread
   • total: (homeScore + awayScore) > line
       │
       ▼
5. Call auto_resolve_sports_market()
       │
       ▼
6. Publish SPORTS_MARKET_RESOLVED event
       │
       ▼
7. Settlement service processes payouts
```

### Manual Resolution

Admins can manually resolve disputed markets:

```typescript
// POST /api/sports/markets/:id/resolve
{
  "outcome": true,
  "reason": "Manual override - VAR decision"
}
```

---

## Security & Rate Limiting

### API Key Management
- Store in `.env` file (never commit)
- `THESPORTSDB_API_KEY=3` (free tier)
- `APIFOOTBALL_API_KEY=xxx`

### Rate Limiting Implementation

```typescript
// Base client with token bucket
class BaseSportsClient {
  private requestQueue: Promise<void> = Promise.resolve();
  private minDelayMs = 1000;
  
  protected async rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve) => {
      this.requestQueue = this.requestQueue.then(async () => {
        await sleep(this.minDelayMs);
        resolve(await fn());
      });
    });
  }
}
```

### Row Level Security

All sports tables have RLS enabled:

```sql
-- Public read access
CREATE POLICY "sports_leagues_select" ON sports_leagues
  FOR SELECT TO authenticated, anon USING (true);

-- Admin write access
CREATE POLICY "sports_leagues_insert" ON sports_leagues
  FOR INSERT TO authenticated 
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

---

## Deployment

### Environment Variables

```env
# API Keys
THESPORTSDB_API_KEY=3
APIFOOTBALL_API_KEY=your_key_here

# Sync Configuration
SPORTS_SYNC_INTERVAL_LIVE=300000      # 5 minutes
SPORTS_SYNC_INTERVAL_UPCOMING=3600000 # 1 hour
SPORTS_SYNC_INTERVAL_LEAGUES=86400000 # 24 hours
SPORTS_ENABLE_SCHEDULED_SYNC=true

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
```

### Database Migration

```bash
# Navigate to Supabase dashboard
# Open SQL Editor
# Run contents of: apps/api/supabase/migrations/013_sports_data.sql
```

### Starting the System

```bash
# 1. Start RabbitMQ (Docker)
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# 2. Start Backend
cd apps/api
npm run start:dev

# 3. Start Frontend
cd apps/web
npm run dev

# 4. Trigger initial sync (optional)
curl -X POST http://localhost:3001/api/sports/sync/leagues
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| No sports data | Trigger manual sync via admin endpoint |
| WebSocket disconnects | Check CORS settings in gateway |
| Rate limit errors | Increase delay between requests |
| Market not resolving | Check event status is 'finished' |

### Logs to Check

```bash
# Backend logs
tail -f apps/api/logs/combined.log

# Sync-specific logs
grep "SportsSyncService" apps/api/logs/combined.log
```

---

*Last Updated: January 2026*
