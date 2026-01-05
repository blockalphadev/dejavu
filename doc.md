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

Users
  ↓
Next.js Frontend
  ↓
NestJS API Gateway
  ↓
Market Engine ───────── Data Ingestion
  ↓                      ↓
PostgreSQL (Supabase)   Normalization
  ↓                      ↓
Redis Cache            Event Store
          ↓
     Resolver Engine
          ↓
Blockchain Layer
(Sui + Solana)

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

---

## 4. Backend (NestJS)

Core modules:
- Auth (Supabase)
- Market
- Prediction
- Resolver
- Ingestion
- Web3

Characteristics:
- Stateless services
- Horizontal scaling
- WebSocket support
- Event-driven

---

## 5. Data Ingestion Flow

External APIs / WebSocket / Scraper
 → Ingestion Workers
 → Normalization & Validation
 → Event Store
 → PostgreSQL + Redis

---

## 6. Market Creation Flow

Admin / DAO
 → Backend Validation
 → Sui Market Object
 → Store Metadata (Postgres)
 → Frontend Listing

---

## 7. User Prediction Flow

User
 → Wallet Connect
 → Submit Prediction
 → Sui Smart Contract
 → Backend Listener
 → Redis Update
 → Live UI Update

---

## 8. Probability Engine

Liquidity State
 → Probability Calculation
 → Redis Snapshot
 → Frontend Subscription

---

## 9. Resolution Flow

Multiple Data Sources
 → Consensus Validation
 → Resolution Proposal
 → Challenge Window
 → Final Resolution
 → Solana Settlement

---

## 10. Dispute Flow

User Dispute
 → Stake Lock (Sui)
 → DAO Vote
 → Verdict
 → Solana Re-Settlement

---

## 11. Database

PostgreSQL:
- users
- markets
- outcomes
- predictions
- resolutions
- disputes

Redis:
- market_snapshot:{id}
- live_probability:{id}

---

## 12. Scaling Strategy

- Horizontal backend scaling
- Redis-based WebSocket fanout
- Kafka topic partitioning
- Read replicas
- Sector-based services

---

## 13. Blockchain Roles

Sui:
- High-frequency interactions
- Market state
- Voting

Solana:
- Final settlement
- Reward distribution
- Immutable records

---

## 14. Roadmap

Phase 1:
- Single sector
- Centralized resolver
- Sui only

Phase 2:
- Multi-sector
- Hybrid resolver
- Solana settlement

Phase 3:
- DAO governance
- Oracle consensus
- Cross-chain liquidity

---

## 15. Conclusion

This platform is:
- Scalable
- Data-independent
- Legal-aware
- Web3-ready
