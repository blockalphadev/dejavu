# Flow Diagram – ExoDuZe Architecture

```
        ┌────────────┐
        │   Users    │
        └─────┬──────┘
              │
              ▼
       ┌──────────────┐
       │ Next.js Front │
       │ (UI + Wallet) │
       └─────┬────────┘
              │ GraphQL/REST
              ▼
       ┌──────────────┐
       │ NestJS API    │
       │ Gateway       │
       └─────┬────────┘
        ┌─────┴───────────────────────────────┐
        │                                     │
        ▼                                     ▼
┌────────────────┐                   ┌────────────────┐
│ Market Engine  │                   │ Sports ETL     │
│ (Order Logic)  │                   │ Orchestrator   │
└─────┬──────────┘                   └─────┬──────────┘
      │                                    │
      ▼                                    ▼
┌──────────────┐                   ┌──────────────┐
│ Redis Cache  │                   │ Multi-Source │
└─────┬────────┘                   │ Integration  │
      │                            └─────┬────────┘
      ▼                                  │
┌──────────────┐                   ┌─────┴────────┐
│ PostgreSQL   │◄──────────────────┤ Resolver     │
│ (Supabase)   │                   │ Engine       │
└─────┬────────┘                   └─────┬────────┘
      │                                  │
      ▼                                  ▼
                         ┌────────────────────────┐
                         │ Blockchain Layer       │
                         │ (Sui + Solana)         │
                         └────────────────────────┘
```

---

## Sports ETL Pipeline Flow (NEW)

```
┌─────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                             │
│  ┌─────────────────┐        ┌───────────────────────────┐   │
│  │  TheSportsDB    │        │  API-Sports (11 endpoints)│   │
│  │  (12 Sports)    │        │  Football│NBA│NFL│Hockey  │   │
│  │  Priority: 50   │        │  MMA│F1│Rugby│Volleyball  │   │
│  └────────┬────────┘        │  Handball│AFL│Basketball  │   │
│           │                 │  Priority: 100            │   │
│           │                 └──────────┬────────────────┘   │
└───────────┼──────────────────────────┼──────────────────────┘
            │                          │
            ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  ETL ORCHESTRATOR                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Extract   │→ │  Transform  │→ │    Deduplicate      │  │
│  │ (Fetch All) │  │ (Normalize) │  │ (Priority Merge)    │  │
│  └─────────────┘  └─────────────┘  └──────────┬──────────┘  │
│                                               │             │
│                                    ┌──────────┴──────────┐  │
│                                    │   Load & Publish    │  │
│                                    └──────────┬──────────┘  │
└───────────────────────────────────────────────┼─────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────┐
         ▼                                      ▼              ▼
┌────────────────┐               ┌────────────────┐    ┌──────────────┐
│   Supabase     │               │   RabbitMQ     │    │   Frontend   │
│   Database     │               │   Messaging    │───►│   WebSocket  │
│                │               │                │    │              │
│ • sports_leagues│               │ • sports.event │    │ • Live Scores│
│ • sports_teams │               │ • sports.live  │    │ • Markets    │
│ • sports_events│               │ • sports.sync  │    │ • Real-time  │
│ • sports_markets│               │                │    │              │
└────────────────┘               └────────────────┘    └──────────────┘
```

---

## Deduplication Logic

```
┌─────────────────────────────────────────────────┐
│              DEDUPLICATION FLOW                  │
│                                                  │
│  1. Create unique key:                          │
│     {sport}:{date}:{home_team}:{away_team}      │
│                                                  │
│  2. Sort by priority:                           │
│     API-Sports (100) > TheSportsDB (50)         │
│                                                  │
│  3. Merge data:                                 │
│     Winner takes base, fill gaps from loser     │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Flowchart – Data Lifecycle

```
[User Action]
      │
      ▼
[Next.js Frontend]
      │
      ▼
[NestJS API Gateway]
      │
      ├──> [Market Engine] ──> [Redis Cache] ──> [PostgreSQL]
      │
      ├──> [Sports ETL] ──> [Deduplication] ──> [Event Store]
      │           │
      │           └──> [RabbitMQ] ──> [WebSocket]
      │
      ▼
[Resolver Engine]
      │
      ▼
[Blockchain Layer]
      │
      ▼
[Event Store + PostgreSQL Sync]
      │
      ▼
[Frontend Realtime Update]
```

---

## Scheduled Sync Tasks

| Task | Cron | Description |
|------|------|-------------|
| Games Sync | `0 * * * *` | Every hour |
| Leagues Sync | `0 3 * * *` | Daily at 3 AM |
| Live Scores | `*/2 * * * *` | Every 2 minutes |

---

## API Endpoints Flow

```
GET /sports/etl/status
      │
      └──> Returns: isSyncing, lastSyncTime, config, apiSportsUsage

POST /sports/etl/sync?type=games
      │
      ├──> Fetch TheSportsDB
      ├──> Fetch API-Sports (if quota available)
      ├──> Deduplicate & Merge
      ├──> Upsert to Database
      └──> Publish to RabbitMQ

POST /sports/etl/sync/:sport
      │
      └──> Same flow but for specific sport only
```

---

## Roadmap Pengembangan ExoDuZe

### Phase 1 – Foundation (Month 1–2)

- Setup monorepo (Turborepo / Nx)
- Implementasi Next.js + NestJS skeleton
- Integrasi Supabase (Auth, DB, Realtime)
- Setup Redis dan Kafka/NATS untuk event streaming

### Phase 2 – Core Market Engine (Month 3–4)

- Implementasi orderbook dan liquidity pool logic
- Integrasi Redis untuk caching order state
- Buat Data Ingestion Service untuk normalisasi event
- Setup Event Store (Kafka atau EventStoreDB)
- **Sports ETL Pipeline** ✓

### Phase 3 – Blockchain Integration (Month 5–6)

- Deploy smart contract di Sui dan Solana
- Integrasi wallet connect (Sui Wallet, Phantom)
- Sinkronisasi transaksi on-chain ↔ off-chain
- Implementasi Resolver Engine untuk hasil pasar

### Phase 4 – Realtime & Analytics (Month 7–8)

- Integrasi Supabase Realtime untuk UI update
- Buat dashboard analitik (market trends, liquidity)
- Optimasi query dan caching layer
- **Multi-sport integration complete** ✓

### Phase 5 – Production & Scaling (Month 9–10)

- Deploy ke Kubernetes / Cloudflare Workers
- Setup monitoring (Prometheus, Grafana)
- Load testing dan security audit
- Launch Beta versi publik

---

*Last Updated: January 15, 2026*
*Version: 2.0 - Multi-Source ETL Pipeline*