# AI Engineers World Fair Schedule Viewer

This is a local-first React/Next.js app for viewing and managing your personal schedule for the AI Engineers World Fair.

## Features

- **Calendar View:**
  - See all events for each day, organized by room and time (9am–7pm, 30-minute intervals).
  - Horizontally scrollable for many rooms.
  - Click any event to view details and speakers in a sidebar.
- **Personal Schedule:**
  - Select or deselect events to add/remove them from your personal schedule.
  - "My Schedule" view shows only your selected events, with only relevant rooms.
  - Conflict detection highlights overlapping events (in full schedule view).
- **Persistence:**
  - Your selected events are saved in your browser's localStorage and persist across reloads.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## Project Structure
- `app/schedule.json` — Source of all event, room, and speaker data
- `src/components/CalendarView.tsx` — Main calendar grid UI
- `src/components/Sidebar.tsx` — Event details and selection sidebar
- `src/utils/scheduleUtils.ts` — Data normalization and grid logic
- `app/page.tsx` — Main app page and state management

## Notes
- This app is designed to run locally and does not require a backend.
- Your schedule is private and stored only in your browser.

---

Enjoy the World Fair! 🎉
