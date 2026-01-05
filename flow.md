Flow Diagram – CryonMarket Architecture

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
│ Market Engine  │                   │ Data Ingestion │
│ (Order Logic)  │                   │ (Normalization)│
└─────┬──────────┘                   └─────┬──────────┘
      │                                    │
      ▼                                    ▼
┌──────────────┐                   ┌──────────────┐
│ Redis Cache  │                   │ Event Store  │
└─────┬────────┘                   └─────┬────────┘
      │                                    │
      ▼                                    ▼
┌──────────────┐                   ┌──────────────┐
│ PostgreSQL   │◄──────────────────┤ Resolver     │
│ (Supabase)   │                   │ Engine       │
└─────┬────────┘                   └─────┬────────┘
      │                                    │
      ▼                                    ▼
                         ┌────────────────────────┐
                         │ Blockchain Layer       │
                         │ (Sui + Solana)         │
                         └────────────────────────┘

Flowchart – Data Lifecycle

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
      ├──> [Data Ingestion] ──> [Event Store]
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

Roadmap Pengembangan CryonMarket

Phase 1 – Foundation (Month 1–2)

Setup monorepo (Turborepo / Nx)
Implementasi Next.js + NestJS skeleton
Integrasi Supabase (Auth, DB, Realtime)
Setup Redis dan Kafka/NATS untuk event streaming

Phase 2 – Core Market Engine (Month 3–4)

Implementasi orderbook dan liquidity pool logic
Integrasi Redis untuk caching order state
Buat Data Ingestion Service untuk normalisasi event
Setup Event Store (Kafka atau EventStoreDB)

Phase 3 – Blockchain Integration (Month 5–6)

Deploy smart contract di Sui dan Solana
Integrasi wallet connect (Sui Wallet, Phantom)
Sinkronisasi transaksi on-chain ↔ off-chain
Implementasi Resolver Engine untuk hasil pasar

Phase 4 – Realtime & Analytics (Month 7–8)

Integrasi Supabase Realtime untuk UI update
Buat dashboard analitik (market trends, liquidity)
Optimasi query dan caching layer

Phase 5 – Production & Scaling (Month 9–10)

Deploy ke Kubernetes / Cloudflare Workers
Setup monitoring (Prometheus, Grafana)
Load testing dan security audit
Launch Beta versi publik