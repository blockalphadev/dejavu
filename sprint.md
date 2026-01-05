# Independent Prediction Market Platform
## Sprint & Phase Plan (Desember 2025 – Maret 2026)

**Start Resmi:** 20 Desember 2025  
**Durasi:** ±10–12 minggu (2–3 bulan)  
**Target MVP:** Akhir Februari – Awal Maret 2026  

---

## OVERALL MILESTONE

| Periode | Target |
|------|------|
| 20–31 Des 2025 | Fondasi & keputusan arsitektur |
| Jan 2026 | Core market & prediction berjalan |
| Feb 2026 | Resolver, settlement, hardening |
| Awal Mar 2026 | MVP production-ready |

---

## PHASE 0 — PREPARATION (LOCK-IN)

**Tanggal:** 20–31 Desember 2025  

### Goal
- Semua keputusan besar terkunci
- Tidak ada perubahan arsitektur saat coding Januari

### Deliverables
- Final architecture approved
- Scope MVP dikunci
- Repo & CI/CD siap
- Supabase (Postgres + Auth + RLS)
- Redis aktif
- RPC Sui & Solana siap

### Tasks
- Finalisasi sektor MVP (Crypto + 1 opsional)
- Lock flow: Ingestion → Market → Prediction → Resolve → Settlement
- Tentukan resolver off-chain
- Setup monorepo & branching
- Setup environment dev/staging

---

## PHASE 1 — FOUNDATION SPRINT

**Periode:** 1 – 26 Januari 2026  

### Sprint 1 (1–12 Jan 2026)
**Fokus:** Backend & Database

- NestJS core modules (Auth, Market, Prediction)
- WebSocket gateway
- Redis cache layer
- Final schema PostgreSQL
- Supabase RLS & seed data
- Docker & logging

### Sprint 2 (13–26 Jan 2026)
**Fokus:** Frontend & Sui

- Next.js market list & detail
- Probability visualization
- Wallet connect (Sui)
- Sui smart contract:
  - Market object
  - Stake / predict
  - Event emit

**Milestone:** User bisa predict & lihat probability

---

## PHASE 2 — CORE MARKET & DATA

**Periode:** 27 Jan – 16 Feb 2026  

### Sprint 3 (27 Jan – 7 Feb)
**Fokus:** Data & Probability

- Crypto data ingestion (API + WebSocket)
- Normalization engine
- Event-based storage
- Liquidity-weighted probability
- Redis snapshot + live update

### Sprint 4 (8 – 16 Feb)
**Fokus:** Resolver Off-chain

- Multi-source consensus
- Resolution proposal
- Challenge window
- Admin fallback resolve

**Milestone:** MVP siap demo publik

---

## PHASE 3 — SETTLEMENT & HARDENING

**Periode:** 17 Feb – 7 Mar 2026  

### Sprint 5
- Solana settlement contract
- Reward distribution
- Final state anchoring
- Rate limiting & replay protection
- Chain sync validation
- Error handling UI
- Monitoring dashboard

---

## FINAL MILESTONE

**Tanggal:** 7 Maret 2026  

### MVP Delivered
- Prediction market berjalan
- Resolve & settlement lengkap
- Multi-source data
- Hybrid Web2 + Web3
- Scale-ready architecture

---

## RESOURCE ESTIMATION

| Role | Jumlah |
|----|----|
| Fullstack | 1–2 |
| Backend | 1 |
| Blockchain | 1 |
| UI/UX | 0.5 |
| **Total** | **3–4 orang** |

---

## CATATAN STRATEGIS

- Phase 0 fokus keputusan, bukan coding berat
- Januari = produktivitas utama
- Jangan tambah sektor baru sebelum Phase 2 selesai
- Resolver adalah jantung platform

