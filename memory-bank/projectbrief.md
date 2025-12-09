# Zerobait – Project Brief

## Overview
Zerobait is a B2C web application that helps everyday internet users detect phishing threats and learn how to avoid them through gamified education. Users can scan URLs for potential phishing, report suspicious sites, play security mini-games, and compete on a global leaderboard. The scanner uses a hybrid AI-powered analysis that aggregates external threat intelligence and produces a concise explanation via Gemini.

## Goals
- Provide a simple, friendly phishing URL checker that anyone (kids, older adults, non-technical people) can use.
- Educate users about phishing and general online safety through interactive mini-games and courses.
- Gamify security awareness using scores, progress, and leaderboards.
- Build a foundation that can later expand to browser extensions, email scanning, mobile apps, and organization-focused features.

## In Scope (Initial Phases)
- Public web app (B2C) accessible to everyone.
- URL scanning flow:
  - User submits a URL.
  - System classifies it as safe / suspicious / community-reported / unknown and returns an AI-written summary.
  - Backend aggregates external signals (VirusTotal, Google Safe Browsing, WhoisXML, SSL Labs, screenshot) and calls Gemini for a short, human-readable explanation.
  - API: `POST /api/ai/analyze` returns `{ ai_summary, risk_score, technical_details }`.
  - Results are cached in Postgres (`scan_results` JSONB) for 30 days to reduce latency and cost.
- User accounts with Google Single Sign-On (SSO).
- Educational mini-games and small “courses” on phishing and online safety.
- Scoring system that tracks user progress across games/courses.
- Global leaderboard displaying top users by score.
- Community reporting of suspicious URLs, surfaced in later scans for other users.

## Out of Scope for MVP (Planned for Future)
- Browser extension for live URL checking.
- Email integration (scanning inbox for phishing emails).
- Native mobile applications.
- Organization-level dashboards and per-company leaderboards.
- Advanced ML-based detection pipeline (beyond simple heuristics/rules and optional free threat intel APIs).

## Success Criteria (First Milestone)
- Working URL check end-to-end (frontend + backend + database persistence).
- 5–6 educational mini-games/courses implemented and playable.
- Functioning global leaderboard tied to user scores.
- Experience is understandable and usable by non-technical users (kids, older adults).

## Constraints
- No paid infrastructure or APIs for the core system at this stage (only free tiers / open-source components).
- Use React on the frontend.
- Use PostgreSQL for persistence; Docker can be used for local development.
- Google SSO for authentication.

## High-Level Deliverables
- Production-ready web UI (React + Tailwind) following the dark, friendly, gamified aesthetic from the provided design examples.
- Backend service (Node.js + Express) exposing APIs for URL scanning, reporting, user/game progress, and leaderboard queries.
- PostgreSQL schema for users, URLs, reports, games, sessions, scores, and leaderboards.
- Basic documentation for setup, development, and deployment (README, environment configuration).
