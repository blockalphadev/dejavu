# Sports Data API Integration Guide

> Technical documentation for integrating TheSportsDB and API-Football external APIs.

---

## Overview

The DeJaVu platform integrates with two external sports data providers to fetch real-time scores, fixtures, and team information.

| Provider | Coverage | Rate Limit (Free) | Best For |
|----------|----------|-------------------|----------|
| TheSportsDB | 12 Sports | 3 req/min | Breadth of sports |
| API-Football | Football only | 300 req/day | Detailed soccer data |

---

## TheSportsDB

### Configuration

```env
THESPORTSDB_API_KEY=3  # Free tier key
```

### Base URL
```
https://www.thesportsdb.com/api/v1/json/{API_KEY}/
```

### Supported Sports Mapping

| Sport ID | Sport Name | League Examples |
|----------|------------|-----------------|
| AFL | Australian Football | AFL Premiership |
| Baseball | Baseball | MLB, NPB |
| Basketball | Basketball | NBA, EuroLeague |
| Soccer | Football/Soccer | Premier League, La Liga |
| Motorsport | Formula 1 | F1 World Championship |
| Handball | Handball | EHF Champions League |
| Ice Hockey | Ice Hockey | NHL, KHL |
| Fighting | MMA | UFC, Bellator |
| American Football | NFL | NFL, CFL |
| Rugby | Rugby | Six Nations, Super Rugby |
| Volleyball | Volleyball | CEV Champions League |

### Key Endpoints

#### Get All Leagues for a Sport
```
GET search_all_leagues.php?s={sport}
```

**Example Response:**
```json
{
  "countries": [
    {
      "idLeague": "4328",
      "strLeague": "English Premier League",
      "strSport": "Soccer",
      "strCountry": "England",
      "strBadge": "https://..."
    }
  ]
}
```

#### Get Teams in a League
```
GET lookup_all_teams.php?id={league_id}
```

**Example Response:**
```json
{
  "teams": [
    {
      "idTeam": "133604",
      "strTeam": "Arsenal",
      "strTeamShort": "ARS",
      "strTeamBadge": "https://...",
      "strStadium": "Emirates Stadium"
    }
  ]
}
```

#### Get Upcoming Events
```
GET eventsnextleague.php?id={league_id}
```

**Example Response:**
```json
{
  "events": [
    {
      "idEvent": "1234567",
      "strEvent": "Arsenal vs Chelsea",
      "idHomeTeam": "133604",
      "idAwayTeam": "133610",
      "dateEvent": "2026-01-20",
      "strTime": "15:00:00",
      "strStatus": "Not Started"
    }
  ]
}
```

#### Get Live Scores
```
GET livescore.php?s={sport}
```

**Example Response:**
```json
{
  "events": [
    {
      "idEvent": "1234567",
      "strEvent": "Arsenal vs Chelsea",
      "intHomeScore": "2",
      "intAwayScore": "1",
      "strProgress": "65'",
      "strStatus": "1H"
    }
  ]
}
```

### Client Implementation

```typescript
// apps/api/src/modules/sports/clients/thesportsdb.client.ts

export class TheSportsDBClient extends BaseSportsClient {
  private readonly baseUrl: string;
  
  constructor() {
    super();
    const apiKey = process.env.THESPORTSDB_API_KEY || '3';
    this.baseUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}`;
  }
  
  async getLeagues(sport: SportType): Promise<SportsLeague[]> {
    const sportName = this.mapSportToApiName(sport);
    const response = await this.rateLimitedRequest(() =>
      fetch(`${this.baseUrl}/search_all_leagues.php?s=${sportName}`)
    );
    
    const data = await response.json();
    return (data.countries || []).map(this.transformLeague);
  }
  
  async getLiveEvents(sport?: SportType): Promise<SportsEvent[]> {
    const sportName = sport ? this.mapSportToApiName(sport) : 'Soccer';
    const response = await this.rateLimitedRequest(() =>
      fetch(`${this.baseUrl}/livescore.php?s=${sportName}`)
    );
    
    const data = await response.json();
    return (data.events || []).map(this.transformEvent);
  }
}
```

---

## API-Football

### Configuration

```env
APIFOOTBALL_API_KEY=your_api_key_here
```

### Base URL & Headers
```
Base: https://v3.football.api-sports.io/

Headers:
  x-rapidapi-key: {API_KEY}
  x-rapidapi-host: v3.football.api-sports.io
```

### Rate Limits

| Plan | Requests/Day | Features |
|------|--------------|----------|
| Free | 100 | Limited leagues |
| Pro | 3000 | All leagues + odds |
| Ultra | Unlimited | Real-time + stats |

### Key Endpoints

#### Get Leagues
```
GET /leagues?season=2026
```

**Example Response:**
```json
{
  "response": [
    {
      "league": {
        "id": 39,
        "name": "Premier League",
        "type": "League",
        "logo": "https://..."
      },
      "country": {
        "name": "England",
        "code": "GB",
        "flag": "https://..."
      },
      "seasons": [...]
    }
  ]
}
```

#### Get Fixtures (Matches)
```
GET /fixtures?league={league_id}&season={year}
```

**Live matches:**
```
GET /fixtures?live=all
```

**Example Response:**
```json
{
  "response": [
    {
      "fixture": {
        "id": 868123,
        "date": "2026-01-20T15:00:00+00:00",
        "status": {
          "long": "First Half",
          "short": "1H",
          "elapsed": 35
        },
        "venue": {
          "name": "Emirates Stadium",
          "city": "London"
        }
      },
      "teams": {
        "home": {
          "id": 42,
          "name": "Arsenal",
          "logo": "https://..."
        },
        "away": {
          "id": 49,
          "name": "Chelsea",
          "logo": "https://..."
        }
      },
      "goals": {
        "home": 2,
        "away": 1
      }
    }
  ]
}
```

#### Get Betting Odds
```
GET /odds?fixture={fixture_id}
```

**Example Response:**
```json
{
  "response": [
    {
      "bookmakers": [
        {
          "name": "Bet365",
          "bets": [
            {
              "name": "Match Winner",
              "values": [
                { "value": "Home", "odd": "1.85" },
                { "value": "Draw", "odd": "3.40" },
                { "value": "Away", "odd": "4.20" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Client Implementation

```typescript
// apps/api/src/modules/sports/clients/api-football.client.ts

export class APIFootballClient extends BaseSportsClient {
  private readonly baseUrl = 'https://v3.football.api-sports.io';
  private readonly headers: Record<string, string>;
  
  constructor() {
    super();
    this.headers = {
      'x-rapidapi-key': process.env.APIFOOTBALL_API_KEY || '',
      'x-rapidapi-host': 'v3.football.api-sports.io',
    };
  }
  
  async getFixtures(leagueId: number, season: number): Promise<SportsEvent[]> {
    const response = await this.rateLimitedRequest(() =>
      fetch(`${this.baseUrl}/fixtures?league=${leagueId}&season=${season}`, {
        headers: this.headers,
      })
    );
    
    const data = await response.json();
    return data.response.map(this.transformFixture);
  }
  
  async getLiveFixtures(): Promise<SportsEvent[]> {
    const response = await this.rateLimitedRequest(() =>
      fetch(`${this.baseUrl}/fixtures?live=all`, {
        headers: this.headers,
      })
    );
    
    const data = await response.json();
    return data.response.map(this.transformFixture);
  }
  
  async getOdds(fixtureId: number): Promise<OddsData> {
    const response = await this.rateLimitedRequest(() =>
      fetch(`${this.baseUrl}/odds?fixture=${fixtureId}`, {
        headers: this.headers,
      })
    );
    
    const data = await response.json();
    return this.extractBestOdds(data.response);
  }
}
```

---

## Rate Limiting Implementation

### Token Bucket Algorithm

```typescript
// apps/api/src/modules/sports/clients/base-sports.client.ts

export abstract class BaseSportsClient {
  private requestQueue: Promise<void> = Promise.resolve();
  private minDelayMs = 1000; // 1 second between requests
  
  protected async rateLimitedRequest<T>(
    fn: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue = this.requestQueue.then(async () => {
        try {
          await this.delay(this.minDelayMs);
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Retry Logic

```typescript
protected async withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await this.delay(delay);
      
      this.logger.warn(`Retry ${attempt + 1}/${maxRetries}: ${error.message}`);
    }
  }
  
  throw lastError!;
}
```

---

## Circuit Breaker Pattern

The API clients implement a circuit breaker to prevent cascading failures when external APIs are unavailable.

### States

| State | Behavior |
|-------|----------|
| **CLOSED** | Normal operation, requests pass through |
| **OPEN** | Fail fast, no requests sent (API down) |
| **HALF_OPEN** | Testing recovery, limited requests |

### Configuration

```typescript
const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,      // Failures before opening
  successThreshold: 3,      // Successes to close from half-open
  resetTimeoutMs: 30000,    // Time in OPEN before testing (30s)
};
```

### Implementation

```typescript
// apps/api/src/modules/sports/clients/base-sports.client.ts

enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

class BaseSportsClient {
  private circuitState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  
  protected async makeRequest<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit state before making request
    if (!this.checkCircuitBreaker()) {
      throw new Error('Circuit breaker is OPEN - service unavailable');
    }
    
    try {
      const result = await this.rateLimitedRequest(fn);
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  private checkCircuitBreaker(): boolean {
    if (this.circuitState === CircuitBreakerState.CLOSED) {
      return true;
    }
    
    if (this.circuitState === CircuitBreakerState.OPEN) {
      // Check if reset timeout has passed
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs) {
        this.circuitState = CircuitBreakerState.HALF_OPEN;
        this.logger.log('Circuit breaker → HALF_OPEN (testing recovery)');
        return true;
      }
      return false;
    }
    
    // HALF_OPEN: allow limited requests
    return true;
  }
  
  private recordSuccess(): void {
    if (this.circuitState === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.circuitState = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.logger.log('Circuit breaker → CLOSED (recovered)');
      }
    }
  }
  
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.circuitState === CircuitBreakerState.HALF_OPEN) {
      this.circuitState = CircuitBreakerState.OPEN;
      this.successCount = 0;
      this.logger.warn('Circuit breaker → OPEN (failed during recovery)');
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.circuitState = CircuitBreakerState.OPEN;
      this.logger.warn('Circuit breaker → OPEN (threshold reached)');
    }
  }
  
  // Admin method to manually reset
  public resetCircuitBreaker(): void {
    this.circuitState = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.logger.log('Circuit breaker manually reset');
  }
  
  // Get current status for monitoring
  public getCircuitBreakerStatus() {
    return {
      state: this.circuitState,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}
```

### Monitoring

```typescript
// Check circuit breaker status
const status = theSportsDBClient.getCircuitBreakerStatus();
console.log(status);
// { state: 'CLOSED', failureCount: 0, successCount: 0, lastFailureTime: 0 }
```

---

## Data Transformation

### Unified Event Model

Both APIs return different structures. We normalize to a single format:

```typescript
interface SportsEvent {
  id: string;
  externalId: string;
  sport: SportType;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  name: string;
  startTime: Date;
  status: EventStatus;
  statusDetail: string;
  homeScore: number;
  awayScore: number;
  venue?: string;
  metadata: Record<string, any>;
}
```

### TheSportsDB Transformation

```typescript
private transformEvent(raw: any): Partial<SportsEvent> {
  return {
    externalId: raw.idEvent,
    name: raw.strEvent,
    homeTeamId: raw.idHomeTeam,
    awayTeamId: raw.idAwayTeam,
    startTime: this.parseDateTime(raw.dateEvent, raw.strTime),
    status: this.mapStatus(raw.strStatus),
    statusDetail: raw.strProgress || raw.strStatus,
    homeScore: parseInt(raw.intHomeScore) || 0,
    awayScore: parseInt(raw.intAwayScore) || 0,
    venue: raw.strVenue,
  };
}

private mapStatus(status: string): EventStatus {
  const statusMap: Record<string, EventStatus> = {
    'Not Started': 'scheduled',
    'Match Finished': 'finished',
    '1H': 'live',
    '2H': 'live',
    'HT': 'halftime',
    'Postponed': 'postponed',
    'Cancelled': 'cancelled',
  };
  return statusMap[status] || 'scheduled';
}
```

### API-Football Transformation

```typescript
private transformFixture(raw: any): Partial<SportsEvent> {
  return {
    externalId: String(raw.fixture.id),
    name: `${raw.teams.home.name} vs ${raw.teams.away.name}`,
    startTime: new Date(raw.fixture.date),
    status: this.mapAPIFootballStatus(raw.fixture.status.short),
    statusDetail: `${raw.fixture.status.elapsed}' - ${raw.fixture.status.long}`,
    homeScore: raw.goals.home || 0,
    awayScore: raw.goals.away || 0,
    venue: raw.fixture.venue?.name,
    metadata: {
      homeTeamLogo: raw.teams.home.logo,
      awayTeamLogo: raw.teams.away.logo,
      referee: raw.fixture.referee,
    },
  };
}
```

---

## Sync Scheduling

### Cron Jobs

```typescript
// apps/api/src/modules/sports/sports-sync.service.ts

@Injectable()
export class SportsSyncService {
  private syncIntervals = {
    live: 5 * 60 * 1000,      // 5 minutes
    upcoming: 60 * 60 * 1000, // 1 hour
    leagues: 24 * 60 * 60 * 1000, // 24 hours
  };
  
  startScheduledSync() {
    // Live events - high frequency
    setInterval(() => this.syncLiveEvents(), this.syncIntervals.live);
    
    // Upcoming events - medium frequency
    setInterval(() => this.syncUpcomingEvents(), this.syncIntervals.upcoming);
    
    // Leagues - low frequency
    setInterval(() => this.syncLeagues(), this.syncIntervals.leagues);
    
    this.logger.log('Scheduled sync started');
  }
}
```

---

## Error Handling

### API Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process data |
| 429 | Rate limited | Wait and retry |
| 401 | Invalid API key | Check credentials |
| 500 | Server error | Retry with backoff |

### Error Logging

```typescript
try {
  const data = await this.fetchFromAPI(endpoint);
  return data;
} catch (error) {
  await this.logSyncError({
    syncType: 'events',
    sport,
    dataSource: 'thesportsdb',
    errorMessage: error.message,
    stackTrace: error.stack,
  });
  throw error;
}
```

---

*Last Updated: January 2026*
