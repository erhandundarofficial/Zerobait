# Zerobait – Active Context

## Current Focus
- Roll out AI-powered URL security analysis across backend and frontend.
- Maintain DB caching (PostgreSQL JSONB) with a 30-day TTL for scan results.
- Prepare for Phase 3 – Leaderboard & Social features.

## Recent Decisions
- Project name: **Zerobait**.
- Target audience: General public (B2C), with special care for kids, older people, and non-technical users.
- Frontend: React SPA with Tailwind CSS, inspired by the provided phishing scanner and educational dashboard designs.
- Backend: Node.js + Express, REST API.
- Database: PostgreSQL with Prisma ORM.
- Auth: Google Single Sign-On (OAuth 2.0).
- Infrastructure: Docker for local development; free-tier-friendly hosting for frontend, backend, and Postgres.
- Detection approach: Rule-based + community reports (no paid APIs).
- Language/tone: Casual, friendly, gamified, simple; prepared for future multi-language support.

- Implemented hybrid AI analysis:
  - Aggregates external intel (VirusTotal, Google Safe Browsing, WhoisXML, SSL Labs, urlscan screenshot) in parallel.
  - Summarizes findings with Gemini; prompt refined to produce concise, label-free, human-readable text (no scores).
  - Full response cached in `scan_results` (PostgreSQL JSONB) for 30 days; frontend indicates when served from cache.
- Environment variables documented in `backend/docs/env.example` (includes `DATABASE_URL` and provider API keys).

## Next Steps (Short-Term)
- Phase 3 – Leaderboard & Social:
  - Implement `/api/leaderboard` and global leaderboard page.
  - Integrate cumulative scores and basic reputation signals.
- AI Analysis polish:
  - Optional cache bypass (force refresh) and admin tools.
  - Fine-tune risk scoring weights and details presentation.

## Important Patterns & Preferences
- Maintain a clear separation between API routes, business logic, and data layer.
- Keep the UI accessible and readable for non-technical users (legible fonts, high contrast, clear CTAs).
- Favor simple, explainable detection logic over opaque, complex models in early phases.

## Open Questions / Future Considerations
- Exact scoring formula for games (per-game weighting, streak bonuses, etc.).
- Detailed game specifications (exact question sets, difficulty tiers, and progression).
- Leaderboard extensions (per-country, friends-only, seasonal resets).
- Internationalization framework and first additional languages beyond English.
