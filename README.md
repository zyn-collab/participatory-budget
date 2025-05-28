# Budget Request Ranking Tool

A web application that helps Ministry of Finance staff rank budget requests through pairwise comparisons using an Elo rating system.

## Features

- Pairwise comparison of budget requests
- Elo rating system for ranking
- Responsive design for desktop and mobile
- Session persistence using localStorage
- Detailed view of each programme
- Final rankings dashboard

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Data Structure

The application reads programme data from `/src/data/programmes.json`. Each programme should follow this structure:

```json
{
  "id": "PROG-001",
  "name": "Programme Name",
  "cost_mvr": 1000000,
  "purpose": "Short purpose description",
  "justification": "Detailed justification",
  "status": "Current status",
  "rating": 1500
}
```

To use your own data:
1. Replace the contents of `/src/data/programmes.json` with your programme data
2. Ensure each programme follows the structure above
3. Restart the development server

## Technical Details

- Built with Next.js 14 and TypeScript
- Styled with Tailwind CSS
- State management using React Context
- Elo rating system with K=32
- Session persistence using localStorage
- Responsive design with mobile-first approach
- Accessibility features including ARIA labels and keyboard navigation

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking 