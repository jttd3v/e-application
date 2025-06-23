# E-Application for CAMII

This project is a Vite-based web application used for collecting personal and sea service information for Cebu Ace-Maritime International Inc. It is written in TypeScript and stores form data in the browser so users can complete the application over multiple sessions.

## Running Locally

**Prerequisites:** Node.js 18+

1. Install dependencies with `npm install`.
2. Set the `GEMINI_API_KEY` value in [.env.local](.env.local).
3. Start a development server with `npm run dev` and open the printed URL in a browser.

Use `npm run build` to generate a production build and `npm run preview` to serve the built files.

## Repository Structure

- `index.html` / `index.tsx` – personal information form
- `camiip2.html` – sea experience form
- `index.css` – shared styling
- `USER_MANUAL.md` – detailed usage instructions

## User Manual

See [USER_MANUAL.md](USER_MANUAL.md) for a walkthrough of the form workflow, navigation and data persistence.
