# Buildwithme - AI-Powered Pair Programming Platform

A modern, animated Welcome Page for Codezista's Buildwithme platform. Built with Next.js, Tailwind CSS, and Framer Motion.

## Features

- 🎨 **Modern UI/UX**: Dark-first theme with glassmorphism effects
- ✨ **Smooth Animations**: Scroll-triggered animations and micro-interactions
- 📱 **Responsive Design**: Desktop-first, mobile-friendly
- 🎯 **Interactive Sections**:
  - Hero Section with floating code snippets
  - What is Buildwithme cards
  - How It Works step-by-step guide
  - Features highlight with hover effects
  - Help & Support section
  - Animated Footer

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

## Requirements

### System Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Operating System**: Windows, macOS, or Linux
- **Browser**: Modern browser with ES6+ support (Chrome, Firefox, Safari, Edge)

### Dependencies

#### Production Dependencies
- **React** (^18.3.1) - UI library
- **React DOM** (^18.3.1) - React rendering
- **Next.js** (^14.2.5) - React framework with SSR
- **Framer Motion** (^11.3.0) - Animation library

#### Development Dependencies
- **TypeScript** (^5.5.3) - Type safety
- **Tailwind CSS** (^3.4.4) - Utility-first CSS framework
- **PostCSS** (^8.4.39) - CSS processing
- **Autoprefixer** (^10.4.19) - CSS vendor prefixing
- **ESLint** (^8.57.0) - Code linting
- **ESLint Config Next** (^14.2.5) - Next.js ESLint configuration

## Installation

### Step 1: Check Prerequisites

Verify that Node.js and npm are installed:

```bash
node --version
# Should output: v18.0.0 or higher

npm --version
# Should output: 9.0.0 or higher
```

If Node.js is not installed, download it from [nodejs.org](https://nodejs.org/)

### Step 2: Clone or Navigate to Project

If you have the project files, navigate to the project directory:

```bash
cd Buildwithme
```

### Step 3: Install Dependencies

Install all required packages:

```bash
npm install
```

This will install all dependencies listed in `package.json`. The installation may take a few minutes.

**Alternative package managers:**
```bash
# Using Yarn
yarn install

# Using pnpm
pnpm install
```

### Step 4: Run Development Server

Start the development server:

```bash
npm run dev
```

You should see output like:
```
  ▲ Next.js 14.2.5
  - Local:        http://localhost:3000
  - ready started server on 0.0.0.0:3000
```

### Step 5: Open in Browser

Open your browser and navigate to:
```
http://localhost:3000
```

The application should now be running locally.

## Development Commands

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm start

# Run ESLint
npm run lint
```

### Build for Production

1. Create an optimized production build:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

The production build will be available at `http://localhost:3000`

### Troubleshooting

#### Port Already in Use
If port 3000 is already in use:
```bash
# Use a different port
npm run dev -- -p 3001
```

#### Dependency Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Project Structure

```
├── app/
│   ├── globals.css              # Global styles and utilities
│   ├── layout.tsx               # Root layout with Inter font
│   └── page.tsx                 # Main page component
├── components/
│   ├── Navbar.tsx               # Navigation bar
│   ├── HeroSection.tsx          # Hero section with CTAs
│   ├── WhatIsSection.tsx        # What is Buildwithme cards
│   ├── HowItWorksSection.tsx    # Step-by-step guide
│   ├── FeaturesSection.tsx      # Features grid
│   ├── SupportSection.tsx       # Help & Support
│   ├── Footer.tsx               # Footer component
│   ├── CodeSnippetCard.tsx      # Interactive code snippet card
│   ├── KeyboardShortcut.tsx     # Keyboard shortcut display
│   └── TerminalOutput.tsx       # Terminal-style output
├── lib/
│   └── animations.ts            # Shared animation configurations
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── postcss.config.mjs            # PostCSS configuration
└── next.config.js                # Next.js configuration
```

## Animation Features

- **Scroll-triggered animations**: Sections animate into view when scrolled
- **Hover effects**: Interactive cards with glow and scale effects
- **Floating elements**: Code snippets float in the hero background with parallax
- **Smooth transitions**: Premium easing curves and spring physics
- **Micro-interactions**: 
  - Button ripple effects
  - Terminal cursor animations
  - Keyboard shortcut displays
  - Code snippet hover effects
  - Developer-focused badges and tooltips

## Customization

### Colors

Edit `tailwind.config.ts` to customize the color scheme.

### Animations

Animation variants are defined in each component. Adjust timing, delays, and effects in the component files.

### Content

Update text content directly in the component files.

## License

© 2024 Codezista. All rights reserved.

