# Zerobait – System Patterns

## High-Level Architecture
- **Frontend:**
  - React single-page application (SPA) using Tailwind CSS.
  - Consumes a RESTful API from the backend.
  - Handles routing for:
    - Home / URL Scanner
    - Games / Courses
    - Leaderboard
    - Profile / Progress
    - Authentication callbacks (Google SSO flow completion where needed).

- **Backend:**
  - Node.js with Express.
  - REST API endpoints for:
    - Authentication (Google OAuth 2.0 login, logout, callback).
    - URL scanning and result retrieval.
    - AI-powered site security analysis (`POST /api/ai/analyze`).
    - Community URL reports.
    - Games metadata (list of games, descriptions, difficulty).
    - Game sessions and answer submissions.
    - User scores and progress.
    - Leaderboard queries.
  - Business logic layer encapsulating URL analysis, scoring rules, and report aggregation.

- **Database:**
  - PostgreSQL as the primary data store.
  - ORM/Query Layer: Prisma or similar (to be finalized during implementation, default assumption: Prisma).

- **Infrastructure:**
  - Local development using Docker (e.g., Docker Compose) to run PostgreSQL and potentially the backend.
  - Deployment to a free-tier-friendly platform for:
    - Backend API service.
    - Frontend static site or SPA hosting.
    - PostgreSQL database (using a free tier, if available).

## Key Domain Concepts
- **User**
  - Authentication via Google SSO.
  - Profile with display name, avatar URL (from Google), country/locale when available.
  - Aggregated score and progress statistics.

- **URL Scan**
  - Input URL is normalized and parsed.
  - System applies rules/heuristics (e.g., suspicious TLDs, known patterns) and community-report signals.
  - Result categories: SAFE, WARNING, COMMUNITY_REPORTED, UNKNOWN.
  - Store scan history and link to user (if logged in) or anonymous ID.

- **URL Report**
  - User-submitted flag on a URL as suspicious/phishing.
  - Aggregated per URL, with counts and basic reputation score.

- **Game**
  - Metadata describing game type (quiz, scenario-based, multiple-choice, etc.).
  - Content such as questions, choices, explanations.

- **Game Session & Score**
  - Each playthrough is recorded as a session.
  - Correct answers and completion yield points based on difficulty.
  - Aggregate score per user drives leaderboard rank.

- **Leaderboard**
  - Global ranking based on total score (and possibly tie-breakers like completion rate or recent activity).

## Core Design Patterns
- **API Layering:**
  - Route handlers → service layer (business logic) → data access layer (ORM).
- **DTO / Response Normalization:**
  - Consistent API responses with a shared envelope (e.g., `{ data, error }`).
- **Auth Middleware:**
  - Express middleware to verify sessions/JWT for protected routes (e.g., game submissions, reporting URLs) while allowing public access for scanning.
- **Configuration via Environment Variables:**
  - OAuth client IDs/secrets.
  - Database connection URLs.
  - Runtime flags (e.g., enable/disable external threat-intel integration).

## URL Detection Approach (MVP → Hybrid)
- **Hybrid pipeline: Heuristics + Community + External Intel + AI Summary**
  - Basic heuristics on URL, host, path.
  - Community reports influence verdict context.
  - External intel (parallel): VirusTotal, Google Safe Browsing, WhoisXML (domain age), SSL Labs (TLS), urlscan.io (screenshot).
  - Gemini generates a concise natural-language explanation (no labels/scores in text).
  - DB caching layer stores full response (JSONB) for 30 days; cache hit returns immediately.

- **Extensibility for Future:**
  - Design the service layer so more advanced ML models or external scanning APIs can be plugged in later without breaking the frontend.

## Security Considerations (Initial)
- Sanitize and normalize all URL input before storing or evaluating.
- Avoid rendering untrusted HTML from remote content.
- Protect authenticated endpoints with session/JWT verification.
- Rate-limit endpoints that could be abused (e.g., report submissions, scan requests).
 - Treat external API failures as non-fatal; degrade gracefully and continue with partial data.

## Important Implementation Paths
1. **Auth Flow:**
   - Frontend initiates Google login → backend handles OAuth callback → creates/updates user in DB → issues session/JWT → frontend stores session state.

2. **Scan Flow:**
   - Frontend sends URL to `/api/ai/analyze` → backend normalizes and aggregates external intel in parallel (VirusTotal, Google Safe Browsing, WhoisXML, SSL Labs, urlscan screenshot) → Gemini returns a concise natural-language explanation → result is cached in Postgres (`scan_results` JSONB, 30-day TTL) → frontend renders AI summary, risk score, and technical details.
   - The legacy `/api/scan` route remains for rule-based and community-report verdicts; it can be used alongside the AI analysis if needed.

3. **Game Flow:**
   - Frontend fetches game list → user chooses game → frontend fetches content → user plays through questions → submits answers to backend → backend calculates score and updates user totals → frontend updates progress UI and leaderboard position.

4. **Leaderboard Flow:**
   - Frontend queries `/api/leaderboard` → backend returns top-ranked users (and possibly current user rank) → frontend displays results in a simple, accessible list.
