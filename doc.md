# doc.md

## Scalable Independent Prediction Market Platform
### Web2 + Web3 Hybrid Architecture

---

## 1. Vision
An independent, scalable, and legally-aware prediction market platform covering:
Sports, Politics, Economy, Finance, Crypto, and Stocks.

Core goals:
- Near real-time data
- Multi-source verification
- Hybrid Web2 + Web3
- Scalable to millions of users

---

## 2. High-Level Architecture

```
Users
  ↓
Next.js Frontend
  ↓
NestJS API Gateway
  ↓
Market Engine ───────── Sports ETL Pipeline
  ↓                      ↓
PostgreSQL (Supabase)   TheSportsDB + API-Sports (11 endpoints)
  ↓                      ↓
Redis Cache            Deduplication & Merge
          ↓
     Resolver Engine
          ↓
Blockchain Layer
(Sui + Solana)
```

---

## 3. Frontend (Next.js)

Stack:
- Next.js (App Router)
- TypeScript
- TailwindCSS
- TanStack Query
- Zustand
- Sui & Solana Wallet Adapters

Responsibilities:
- Market browsing
- Probability visualization
- Prediction interaction
- Wallet connection
- Sports market display (Polymarket-style)

---

## 4. Backend (NestJS)

Core modules:
- Auth (Supabase)
- Market
- Prediction
- Resolver
- Ingestion
- Web3
- **Sports** (NEW)

Sports Module Services:
- `SportsService` - CRUD operations
- `SportsSyncService` - Sync orchestration
- `SportsETLOrchestrator` - Multi-source ETL pipeline
- `SportsMessagingService` - RabbitMQ publishers
- `SportsCleanerService` - Data validation & deduplication
- `SportsGateway` - WebSocket real-time updates

Characteristics:
- Stateless services
- Horizontal scaling
- WebSocket support
- Event-driven

---

## 5. Sports ETL Pipeline (NEW)

### Data Sources

| Source | Coverage | Rate Limit | Priority |
|--------|----------|------------|----------|
| TheSportsDB | 12 Sports | 1000/day | 50 |
| API-Sports | 11 Endpoints | 100/day | 100 |

### API-Sports Endpoints

- Football (v3.football.api-sports.io)
- Basketball (v1.basketball.api-sports.io)
- NBA (v2.nba.api-sports.io)
- NFL (v1.american-football.api-sports.io)
- Hockey (v1.hockey.api-sports.io)
- MMA (v1.mma.api-sports.io)
- Formula-1 (v1.formula-1.api-sports.io)
- Rugby (v1.rugby.api-sports.io)
- Volleyball (v1.volleyball.api-sports.io)
- Handball (v1.handball.api-sports.io)
- AFL (v1.afl.api-sports.io)

### ETL Flow

```
1. EXTRACT
   ├── TheSportsDB (12 sports)
   └── API-Sports (11 endpoints)
            ↓
2. TRANSFORM
   └── Normalize to internal format
            ↓
3. DEDUPLICATE
   └── Match by (sport + date + home_team + away_team)
            ↓
4. MERGE
   └── API-Sports wins (priority 100 > TheSportsDB 50)
            ↓
5. LOAD
   └── Upsert to Supabase
            ↓
6. PUBLISH
   └── RabbitMQ → WebSocket → Frontend
```

### Scheduled Tasks

| Task | Schedule | Description |
|------|----------|-------------|
| Games Sync | Every hour | Upcoming games |
| Leagues Sync | Daily 3 AM | Full refresh |
| Live Scores | Every 2 min | Live updates |

---

## 6. Data Ingestion Flow

External APIs / WebSocket / Scraper
 → Ingestion Workers
 → Normalization & Validation
 → Deduplication (priority-based)
 → Event Store
 → PostgreSQL + Redis
 → RabbitMQ Publication

---

## 7. Market Creation Flow

Admin / DAO
 → Backend Validation
 → Sui Market Object
 → Store Metadata (Postgres)
 → Frontend Listing

---

## 8. User Prediction Flow

User
 → Wallet Connect
 → Submit Prediction
 → Sui Smart Contract
 → Backend Listener
 → Redis Update
 → Live UI Update

---

## 9. Probability Engine

Liquidity State
 → Probability Calculation
 → Redis Snapshot
 → Frontend Subscription

---

## 10. Resolution Flow

Multiple Data Sources
 → Consensus Validation
 → Resolution Proposal
 → Challenge Window
 → Final Resolution
 → Solana Settlement

--- 

## 11. Dispute Flow

User Dispute
 → Stake Lock (Sui)
 → DAO Vote
 → Verdict
 → Solana Re-Settlement

---

## 12. Database

PostgreSQL:
- users
- markets
- outcomes
- predictions
- resolutions
- disputes
- **sports_leagues** (NEW)
- **sports_teams** (NEW)
- **sports_events** (NEW)
- **sports_markets** (NEW)
- **sports_sync_logs** (NEW)

Redis:
- market_snapshot:{id}
- live_probability:{id}
- sports_live:{sport}

---

## 13. Sports API Endpoints

### Public
- GET `/api/v1/sports/categories`
- GET `/api/v1/sports/leagues`
- GET `/api/v1/sports/events`
- GET `/api/v1/sports/events/live`
- GET `/api/v1/sports/markets`

### ETL Admin
- GET `/api/v1/sports/etl/status`
- POST `/api/v1/sports/etl/sync`
- POST `/api/v1/sports/etl/sync/:sport`
- POST `/api/v1/sports/etl/sync/live`

---

## 14. Scaling Strategy

- Horizontal backend scaling
- Redis-based WebSocket fanout
- Kafka topic partitioning
- Read replicas
- Sector-based services
- Global rate limiting for external APIs

---

## 15. Blockchain Roles

Sui:
- High-frequency interactions
- Market state
- Voting

Solana:
- Final settlement
- Reward distribution
- Immutable records

---

## 16. Environment Variables

```env
# Sports ETL
THESPORTSDB_API_KEY=3
APIFOOTBALL_API_KEY=your_key
APISPORTS_REQUESTS_PER_DAY=100
ETL_ENABLE_THESPORTSDB=true
ETL_ENABLE_APISPORTS=true
ETL_ENABLE_SCHEDULED_SYNC=true
ETL_DEDUPLICATE_BY_NAME=true
SPORTS_ENABLE_MESSAGING=true
```

---

## 17. Roadmap

Phase 1:
- Single sector
- Centralized resolver
- Sui only

Phase 2:
- Multi-sector
- Hybrid resolver
- Solana settlement
- **Sports ETL Pipeline** ✓

Phase 3:
- DAO governance
- Oracle consensus
- Cross-chain liquidity

---

## 18. Conclusion

This platform is:
- Scalable
- Data-independent
- Legal-aware
- Web3-ready
- **Multi-sport integrated** ✓

---

*Last Updated: January 15, 2026*

