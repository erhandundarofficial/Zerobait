# Zerobait – Product Context

## Why Zerobait Exists
Phishing attacks disproportionately hurt vulnerable users: kids, older adults, and people without a strong technical background. For many of them, phishing sites are confusing and scary. Zerobait exists to:
- Make it easy to quickly check if a link looks dangerous.
- Teach users in a fun, non-intimidating way how to recognize scams.
- Build long-term security awareness instead of one-time training.

## Core Problems
- Many users cannot distinguish legitimate websites from phishing pages.
- Traditional security education (long articles, corporate trainings) is boring and not memorable.
- There is little community feedback around suspicious URLs outside of security tools.

## How Zerobait Should Work (User-Level)
- **Check a URL:**
  - User lands on the homepage.
  - Pastes or types a URL into a simple input field.
  - Clicks "Scan" and receives a clear, color-coded result:
    - SAFE
    - WARNING / SUSPICIOUS
    - COMMUNITY REPORTED
    - UNKNOWN
  - A short AI summary explains the situation in plain language (no labels or scores in text).
  - A risk score (0–100) is visualized via UI elements (badge/progress bar).
  - User can expand technical details (VirusTotal stats, SSL Labs endpoints, WHOIS creation date, screenshot if available).

- **Learn & Play:**
  - After or instead of scanning, user can go to an Education / Games area.
  - They pick from several mini-games and short lessons (e.g., spotting fake emails, detecting tricky URLs, understanding passwords, recognizing social engineering).
  - Correct answers and completed modules add to their score and progress.

- **Compete & Compare:**
  - User’s score contributes to a global leaderboard.
  - Leaderboard displays top users, their ranks, and basic stats.
  - This gives a sense of achievement and encourages continued learning.

- **Report Suspicious URLs:**
  - When scanning a URL, user can flag it as suspicious.
  - Future users scanning the same URL see that it has community reports and can view aggregated signals.

## User Experience Goals
- **Friendly & Gamified:**
  - Use playful visuals and progress elements (bars, badges, simple avatars) to reduce fear.
  - Focus on “learning to be a detective” rather than “you are in danger.”

- **Simple for Non-Technical Users:**
  - Minimal jargon.
  - Clear labels ("Safe", "Warning") and short explanations.
  - Big buttons and accessible layouts.

- **Casual Tone:**
  - Use plain, encouraging language.
  - Avoid overly technical or fear-based messaging.

- **Multilingual-Ready:**
  - Start with English but design copy and UI so it can be internationalized later (string separation, no text baked into images, etc.).

## Initial User Personas
- **Curious Parent:** Wants to check links their kids click on and learn enough to guide them.
- **Non-Technical Adult:** Receives suspicious SMS/emails and wants a quick way to verify links.
- **Student / Teen:** Enjoys gamified learning and wants to “level up” their internet safety skills.

## Example Flows
- **Quick Scan Flow:**
  - Open Zerobait → Paste URL → Scan → See result → Optionally expand details or report.

- **Learning Flow:**
  - Open Zerobait → Go to "Games" → Pick a game (e.g., Email Interceptor) → Play short rounds → Earn score → See score increase and leaderboard rank.

- **Community Reporting Flow:**
  - Scan a suspicious URL → Result shows "Unknown" or "Potentially risky" → User clicks "Report this URL" → System stores the report and links it to the URL → Future scans show "Reported by community."
