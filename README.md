# WalkSafe AI

AI-powered personal safety companion that detects unusual journey patterns, performs automated safety check-ins, and alerts trusted contacts when help is needed.

## Features
- **Deterministic & AI Safety Scoring**: Continuous multi-signal risk telemetry (route deviation, stationary inactivity, delays, missed check-ins).
- **Interactive Live Map & Journey Monitoring**: Real-time Leaflet mapping with start/destination routing, breadcrumbs, and real-time status.
- **Automated Check-Ins & Proactive Prompts**: Timed countdowns to verify traveler status.
- **Emergency SOS & Guardian Alerts**: Instant panic triggering with multi-channel alert simulated dispatches and location pinpoint links.
- **Demo & Simulation Suite**: Easily trigger anomalies (deviation, inactivity, high risk) for testing and evaluation.

## Run Locally

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY if using live Gemini risk analysis
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the web app at [http://localhost:3000](http://localhost:3000)
