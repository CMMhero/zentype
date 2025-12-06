# ZenType

A minimalist, aesthetically pleasing typing speed tester designed for focus and self-improvement.

## Overview

ZenType is a project built to provide a clean, distraction-free environment for practicing typing. Unlike cluttered alternatives, it focuses on visual clarity and user customization, allowing you to tailor the experience to your preferences with various themes, fonts, and modes.

## Features

- **Multiple Modes**: Practice with timed tests (15s, 30s, 60s) or fixed word counts.
- **Customization**:
  - **Themes**: Choose from curated color palettes like Nord, Dracula, and more.
  - **Typography**: Switch between Monospaced, Serif, and Sans-serif fonts.
  - **Visuals**: Adjust caret style, font size, and interface density.
- **Progress Tracking**: Automatically saves your test history to local storage so you can monitor your WPM trends over time.
- **Blind Mode**: Key feedback is hidden to encourage raw accuracy and focus.
- **Smooth Interaction**: Designed with a "restart on Tab" workflow for rapid-fire practice sessions.

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/CMMhero/zentype.git
   ```

2. Navigate to the project directory:
   ```bash
   cd zentype
   ```

3. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will launch at `http://localhost:5173` (or similar).

## Structure

```
src/
├── components/      # Reusable UI components (VirtualKeyboard, Caret, etc.)
├── hooks/           # Custom hooks (useInterval, game logic)
├── pages/           # Main route views (Test, Settings, History)
├── types.ts         # TypeScript definitions
└── constants.ts     # Configuration, themes, and defaults
```

## License

This project is open source and available under the [MIT License](LICENSE).
