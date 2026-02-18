# AI Museum Artifact Explorer - React Frontend

A modern React + Vite frontend for the AI-Powered Museum Artifact Exploration System.

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast development and build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

## Design System

### Color Palette
- Background: Warm Beige (#FDFBF7)
- Primary: Amber/Gold (#B45309, #92400E)
- Stone grays for text and borders
- Emerald for positive indicators
- Rose for differences/alerts

### Typography
- **Headings**: Playfair Display (Serif)
- **Body**: Inter (Sans-serif)

## Features

### Screen 1: Gallery (Home)
- Responsive grid of artifact cards
- Search by name, description, or category
- Filter by Category, Era, and Origin
- Smooth animations and hover effects

### Screen 2: Artifact Detail
- Large feature image display
- Complete metadata panel
- AI-powered analysis generation
- Similar artifacts with similarity scores
- One-click comparison initiation

### Screen 3: Comparison Engine
- Side-by-side artifact comparison
- Visual comparison of images and metadata
- AI-generated insights including:
  - Similarities (bulleted list)
  - Differences (detailed breakdown)
  - Cultural significance analysis

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy artifact images to public folder:
```bash
# Create images directory
mkdir -p public/images

# Copy images from static folder
cp ../static/images/* public/images/
```

4. Start development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── public/
│   ├── images/          # Artifact images
│   └── vite.svg         # Favicon
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── GalleryScreen.jsx
│   │   ├── ArtifactCard.jsx
│   │   ├── DetailScreen.jsx
│   │   ├── SimilarArtifactCard.jsx
│   │   └── ComparisonScreen.jsx
│   ├── data/
│   │   └── artifacts.js  # Mock data and helpers
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles and Tailwind
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## API Integration

The frontend is configured to proxy API requests to the Flask backend running on port 5000. Update `vite.config.js` if your backend runs on a different port.

Current mock data can be replaced with actual API calls by modifying the functions in `src/data/artifacts.js`.

## Customization

### Adding New Artifacts
Edit `src/data/artifacts.js` to add new artifacts to the `ARTIFACTS_DATA` array.

### Changing Colors
Modify `tailwind.config.js` to update the color palette.

### Adding New Features
Create new components in the `src/components` directory and import them in `App.jsx`.
