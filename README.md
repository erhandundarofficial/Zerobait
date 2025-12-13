# Zerobait

A friendly, gamified web application that helps everyday internet users detect phishing threats and learn how to avoid them through interactive education.

## Overview

Zerobait is a B2C web application that makes phishing detection accessible to everyone, especially kids, older adults, and non-technical users. It combines AI-powered URL scanning with gamified learning to build long-term security awareness.

The scanner uses a hybrid AI-powered analysis that aggregates external threat intelligence from multiple sources and produces concise explanations via Google's Gemini API, while the educational component uses mini-games to teach security concepts in an engaging way.

## Features

### 🔍 URL Scanner
- **AI-Powered Analysis**: Aggregates external intelligence (VirusTotal, Google Safe Browsing, WhoisXML, SSL Labs, urlscan.io) and generates human-readable summaries via Gemini
- **Clear Results**: Color-coded verdicts (SAFE, WARNING, COMMUNITY_REPORTED, UNKNOWN) with risk scores (0-100) and technical details
- **Smart Caching**: Results cached in PostgreSQL for 30 days to reduce latency and costs

### 🎮 Gamified Learning
- **Educational Games**: 5+ interactive mini-games covering email security, URL detection, password safety, and social engineering
- **Progress Tracking**: Score accumulation and progress visualization to encourage continued learning
- **Leaderboard**: Global competition with rankings based on educational achievements, with time filters (all-time, 24h, 7d, 30d)

### 👥 Community Features
- **URL Reporting**: Users can flag suspicious URLs, helping protect the community
- **Reputation System**: Reports from users with higher scores carry more weight (in development)

## Tech Stack

### Frontend
- **React** with Vite for fast development and hot reload
- **Tailwind CSS** with custom dark theme and gamified aesthetic
- **React Router** for client-side routing and navigation
- **Material Symbols** for icons and visual elements

### Backend
- **Node.js** with Express for REST API
- **Google OAuth 2.0** for authentication via Passport.js
- **Gemini API** for AI-powered security summaries
- **Prisma ORM** for type-safe database operations

### Database & Infrastructure
- **PostgreSQL** as primary database
- **Docker Compose** for local development environment
- **Free-tier hosting** ready for production deployment

## Getting Started

### Prerequisites
- Node.js (LTS)
- Docker and Docker Compose
- Google Cloud Project (for OAuth and Gemini API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/erhandundarofficial/Zerobait.git
   cd Zerobait
   ```

2. **Set up environment variables**
   ```bash
   cp backend/docs/env.example .env
   # Edit .env with your API keys and database URL
   ```
   
   Required variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `GEMINI_API_KEY` - Google Generative Language API key
   - Google OAuth credentials (client ID and secret)
   - External API keys (optional): VirusTotal, Google Safe Browsing, WhoisXML, URLScan

3. **Start the development environment**
   ```bash
   # Start PostgreSQL with Docker
   docker-compose up -d
   
   # Install dependencies
   cd frontend && npm install
   cd ../backend && npm install
   
   # Run database migrations
   npx prisma migrate dev
   
   # Start both services
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000
   - API Health Check: http://localhost:4000/health

## Development

### Project Structure
```
Zerobait/
├── frontend/          # React application
│   ├── src/
│   │   ├── pages/     # Page components
│   │   ├── auth/      # Authentication context
│   │   └── main.tsx   # App entry point
├── backend/           # Express API server
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Business logic
│   │   └── prisma/    # Database schema
└── docker-compose.yml # Local development setup
```

### Key API Endpoints
- `POST /api/ai/analyze` - AI-powered URL analysis with external threat intelligence
- `POST /api/scan` - Rule-based URL scanning
- `POST /api/report-url` - Community URL reporting
- `GET /api/games` - List educational games
- `POST /api/games/:key/submit` - Submit game answers for scoring
- `GET /api/leaderboard` - Global rankings with time filters

### Architecture Patterns
- **Layered Architecture**: Routes → Services → Data Access
- **DTO Pattern**: Consistent API response envelopes with `{data, error}` format
- **Auth Middleware**: Protected routes for user-specific features
- **Caching Layer**: PostgreSQL JSONB for scan results with 30-day TTL

## Current Status

### Completed Features
- ✅ Phase 0: Foundation & Architecture
- ✅ Phase 1: URL Scanner MVP with AI analysis
- ✅ Phase 2: Educational games and scoring system
- ✅ Phase 3: Global leaderboard with time filters

### In Development
- 🔄 Reputation weighting for community reports
- 🔄 Admin moderation tools
- 🔄 UI polish and animations

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow
1. Fork the repository and create a feature branch
2. Ensure all tests pass and code follows project conventions
3. Update documentation after significant changes
4. Maintain the friendly, accessible tone throughout
5. Submit a pull request with clear description of changes

### Code Style
- TypeScript for type safety
- Tailwind CSS for consistent styling
- Prisma for database operations
- Environment variables for configuration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- External threat intelligence providers: VirusTotal, Google Safe Browsing, WhoisXML, SSL Labs, urlscan.io
- Google Generative Language API for AI-powered summaries
- The open-source community for the tools and libraries that make this project possible

---

Built with ❤️ for a safer internet.

Wiki pages you might want to explore:
- [Core Features (erhandundarofficial/Zerobait)](/wiki/erhandundarofficial/Zerobait#4)
- [Page Components (erhandundarofficial/Zerobait)](/wiki/erhandundarofficial/Zerobait#6.1)
- [Backend API Implementation (erhandundarofficial/Zerobait)](/wiki/erhandundarofficial/Zerobait#7)
